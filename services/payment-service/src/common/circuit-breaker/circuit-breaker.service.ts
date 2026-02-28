import { Injectable, Logger } from '@nestjs/common';

/**
 * Circuit Breaker States
 */
enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation, requests pass through
  OPEN = 'OPEN',         // Circuit is open, requests fail fast
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

/**
 * Circuit Breaker Configuration
 */
interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening circuit
  successThreshold: number;      // Number of successes to close from half-open
  timeout: number;                // Time in ms before considering request failed
  resetTimeout: number;          // Time in ms before attempting to close circuit
}

/**
 * Circuit Breaker Statistics
 */
interface CircuitStats {
  failures: number;
  successes: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  state: CircuitState;
}

/**
 * OPTIMIZATION: Circuit Breaker Pattern for inter-service communication
 * Prevents cascading failures by failing fast when services are down
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private circuits: Map<string, CircuitStats> = new Map();
  private readonly defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 5,        // Open circuit after 5 failures
    successThreshold: 2,         // Close circuit after 2 successes
    timeout: 30000,              // 30 seconds timeout
    resetTimeout: 60000,         // Wait 60 seconds before trying again
  };

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    serviceName: string,
    operation: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>,
  ): Promise<T> {
    const circuitKey = serviceName;
    const fullConfig = { ...this.defaultConfig, ...config };
    const stats = this.getOrCreateStats(circuitKey);

    // Check circuit state
    if (stats.state === CircuitState.OPEN) {
      // Check if we should attempt recovery
      if (this.shouldAttemptRecovery(stats, fullConfig.resetTimeout)) {
        stats.state = CircuitState.HALF_OPEN;
        stats.failures = 0;
        stats.successes = 0;
        this.logger.log(`Circuit ${circuitKey} moved to HALF_OPEN state`);
      } else {
        throw new Error(`Circuit breaker is OPEN for service ${serviceName}. Service unavailable.`);
      }
    }

    try {
      // Execute with timeout
      const result = await Promise.race([
        operation(),
        this.createTimeoutPromise(fullConfig.timeout),
      ]);

      // Success - update stats
      this.recordSuccess(circuitKey, stats, fullConfig);
      return result as T;
    } catch (error: any) {
      // Failure - update stats
      this.recordFailure(circuitKey, stats, fullConfig);
      
      // Re-throw the error
      throw error;
    }
  }

  /**
   * Get or create circuit statistics
   */
  private getOrCreateStats(circuitKey: string): CircuitStats {
    if (!this.circuits.has(circuitKey)) {
      this.circuits.set(circuitKey, {
        failures: 0,
        successes: 0,
        state: CircuitState.CLOSED,
      });
    }
    return this.circuits.get(circuitKey)!;
  }

  /**
   * Record a successful operation
   */
  private recordSuccess(
    circuitKey: string,
    stats: CircuitStats,
    config: CircuitBreakerConfig,
  ): void {
    stats.successes++;
    stats.lastSuccessTime = new Date();
    stats.failures = 0; // Reset failure count on success

    if (stats.state === CircuitState.HALF_OPEN) {
      if (stats.successes >= config.successThreshold) {
        stats.state = CircuitState.CLOSED;
        this.logger.log(`Circuit ${circuitKey} CLOSED after ${stats.successes} successes`);
        stats.successes = 0;
      }
    }
  }

  /**
   * Record a failed operation
   */
  private recordFailure(
    circuitKey: string,
    stats: CircuitStats,
    config: CircuitBreakerConfig,
  ): void {
    stats.failures++;
    stats.lastFailureTime = new Date();

    if (stats.state === CircuitState.HALF_OPEN) {
      // If we fail in half-open, immediately open the circuit
      stats.state = CircuitState.OPEN;
      this.logger.warn(`Circuit ${circuitKey} OPENED after failure in HALF_OPEN state`);
    } else if (stats.state === CircuitState.CLOSED) {
      if (stats.failures >= config.failureThreshold) {
        stats.state = CircuitState.OPEN;
        this.logger.error(
          `Circuit ${circuitKey} OPENED after ${stats.failures} failures`,
        );
      }
    }
  }

  /**
   * Check if we should attempt recovery from OPEN state
   */
  private shouldAttemptRecovery(
    stats: CircuitStats,
    resetTimeout: number,
  ): boolean {
    if (!stats.lastFailureTime) {
      return true;
    }

    const timeSinceLastFailure = Date.now() - stats.lastFailureTime.getTime();
    return timeSinceLastFailure >= resetTimeout;
  }

  /**
   * Create a timeout promise
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Get circuit state for a service
   */
  getCircuitState(serviceName: string): CircuitState {
    const stats = this.getOrCreateStats(serviceName);
    return stats.state;
  }

  /**
   * Reset circuit for a service (for testing/admin purposes)
   */
  resetCircuit(serviceName: string): void {
    this.circuits.delete(serviceName);
    this.logger.log(`Circuit ${serviceName} reset`);
  }

  /**
   * Get all circuit states (for monitoring)
   */
  getAllCircuitStates(): Record<string, CircuitStats> {
    const states: Record<string, CircuitStats> = {};
    this.circuits.forEach((stats, key) => {
      states[key] = { ...stats };
    });
    return states;
  }
}

