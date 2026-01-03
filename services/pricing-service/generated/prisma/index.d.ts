
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model ProductPricing
 * 
 */
export type ProductPricing = $Result.DefaultSelection<Prisma.$ProductPricingPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more ProductPricings
 * const productPricings = await prisma.productPricing.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more ProductPricings
   * const productPricings = await prisma.productPricing.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.productPricing`: Exposes CRUD operations for the **ProductPricing** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ProductPricings
    * const productPricings = await prisma.productPricing.findMany()
    * ```
    */
  get productPricing(): Prisma.ProductPricingDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.2.0
   * Query Engine version: 0c8ef2ce45c83248ab3df073180d5eda9e8be7a3
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    ProductPricing: 'ProductPricing'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "productPricing"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      ProductPricing: {
        payload: Prisma.$ProductPricingPayload<ExtArgs>
        fields: Prisma.ProductPricingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProductPricingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPricingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProductPricingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPricingPayload>
          }
          findFirst: {
            args: Prisma.ProductPricingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPricingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProductPricingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPricingPayload>
          }
          findMany: {
            args: Prisma.ProductPricingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPricingPayload>[]
          }
          create: {
            args: Prisma.ProductPricingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPricingPayload>
          }
          createMany: {
            args: Prisma.ProductPricingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProductPricingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPricingPayload>[]
          }
          delete: {
            args: Prisma.ProductPricingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPricingPayload>
          }
          update: {
            args: Prisma.ProductPricingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPricingPayload>
          }
          deleteMany: {
            args: Prisma.ProductPricingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProductPricingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ProductPricingUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPricingPayload>[]
          }
          upsert: {
            args: Prisma.ProductPricingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPricingPayload>
          }
          aggregate: {
            args: Prisma.ProductPricingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProductPricing>
          }
          groupBy: {
            args: Prisma.ProductPricingGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProductPricingGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProductPricingCountArgs<ExtArgs>
            result: $Utils.Optional<ProductPricingCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    productPricing?: ProductPricingOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model ProductPricing
   */

  export type AggregateProductPricing = {
    _count: ProductPricingCountAggregateOutputType | null
    _avg: ProductPricingAvgAggregateOutputType | null
    _sum: ProductPricingSumAggregateOutputType | null
    _min: ProductPricingMinAggregateOutputType | null
    _max: ProductPricingMaxAggregateOutputType | null
  }

  export type ProductPricingAvgAggregateOutputType = {
    basePrice: Decimal | null
    resellerPrice: Decimal | null
    commissionRate: Decimal | null
    minMargin: Decimal | null
  }

  export type ProductPricingSumAggregateOutputType = {
    basePrice: Decimal | null
    resellerPrice: Decimal | null
    commissionRate: Decimal | null
    minMargin: Decimal | null
  }

  export type ProductPricingMinAggregateOutputType = {
    id: string | null
    productId: string | null
    basePrice: Decimal | null
    resellerPrice: Decimal | null
    commissionRate: Decimal | null
    minMargin: Decimal | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ProductPricingMaxAggregateOutputType = {
    id: string | null
    productId: string | null
    basePrice: Decimal | null
    resellerPrice: Decimal | null
    commissionRate: Decimal | null
    minMargin: Decimal | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ProductPricingCountAggregateOutputType = {
    id: number
    productId: number
    basePrice: number
    resellerPrice: number
    commissionRate: number
    minMargin: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ProductPricingAvgAggregateInputType = {
    basePrice?: true
    resellerPrice?: true
    commissionRate?: true
    minMargin?: true
  }

  export type ProductPricingSumAggregateInputType = {
    basePrice?: true
    resellerPrice?: true
    commissionRate?: true
    minMargin?: true
  }

  export type ProductPricingMinAggregateInputType = {
    id?: true
    productId?: true
    basePrice?: true
    resellerPrice?: true
    commissionRate?: true
    minMargin?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ProductPricingMaxAggregateInputType = {
    id?: true
    productId?: true
    basePrice?: true
    resellerPrice?: true
    commissionRate?: true
    minMargin?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ProductPricingCountAggregateInputType = {
    id?: true
    productId?: true
    basePrice?: true
    resellerPrice?: true
    commissionRate?: true
    minMargin?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ProductPricingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ProductPricing to aggregate.
     */
    where?: ProductPricingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProductPricings to fetch.
     */
    orderBy?: ProductPricingOrderByWithRelationInput | ProductPricingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProductPricingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProductPricings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProductPricings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ProductPricings
    **/
    _count?: true | ProductPricingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ProductPricingAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ProductPricingSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProductPricingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProductPricingMaxAggregateInputType
  }

  export type GetProductPricingAggregateType<T extends ProductPricingAggregateArgs> = {
        [P in keyof T & keyof AggregateProductPricing]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProductPricing[P]>
      : GetScalarType<T[P], AggregateProductPricing[P]>
  }




  export type ProductPricingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProductPricingWhereInput
    orderBy?: ProductPricingOrderByWithAggregationInput | ProductPricingOrderByWithAggregationInput[]
    by: ProductPricingScalarFieldEnum[] | ProductPricingScalarFieldEnum
    having?: ProductPricingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProductPricingCountAggregateInputType | true
    _avg?: ProductPricingAvgAggregateInputType
    _sum?: ProductPricingSumAggregateInputType
    _min?: ProductPricingMinAggregateInputType
    _max?: ProductPricingMaxAggregateInputType
  }

  export type ProductPricingGroupByOutputType = {
    id: string
    productId: string
    basePrice: Decimal
    resellerPrice: Decimal
    commissionRate: Decimal
    minMargin: Decimal | null
    createdAt: Date
    updatedAt: Date
    _count: ProductPricingCountAggregateOutputType | null
    _avg: ProductPricingAvgAggregateOutputType | null
    _sum: ProductPricingSumAggregateOutputType | null
    _min: ProductPricingMinAggregateOutputType | null
    _max: ProductPricingMaxAggregateOutputType | null
  }

  type GetProductPricingGroupByPayload<T extends ProductPricingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProductPricingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProductPricingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProductPricingGroupByOutputType[P]>
            : GetScalarType<T[P], ProductPricingGroupByOutputType[P]>
        }
      >
    >


  export type ProductPricingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    productId?: boolean
    basePrice?: boolean
    resellerPrice?: boolean
    commissionRate?: boolean
    minMargin?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["productPricing"]>

  export type ProductPricingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    productId?: boolean
    basePrice?: boolean
    resellerPrice?: boolean
    commissionRate?: boolean
    minMargin?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["productPricing"]>

  export type ProductPricingSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    productId?: boolean
    basePrice?: boolean
    resellerPrice?: boolean
    commissionRate?: boolean
    minMargin?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["productPricing"]>

  export type ProductPricingSelectScalar = {
    id?: boolean
    productId?: boolean
    basePrice?: boolean
    resellerPrice?: boolean
    commissionRate?: boolean
    minMargin?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ProductPricingOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "productId" | "basePrice" | "resellerPrice" | "commissionRate" | "minMargin" | "createdAt" | "updatedAt", ExtArgs["result"]["productPricing"]>

  export type $ProductPricingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ProductPricing"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      productId: string
      basePrice: Prisma.Decimal
      resellerPrice: Prisma.Decimal
      commissionRate: Prisma.Decimal
      minMargin: Prisma.Decimal | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["productPricing"]>
    composites: {}
  }

  type ProductPricingGetPayload<S extends boolean | null | undefined | ProductPricingDefaultArgs> = $Result.GetResult<Prisma.$ProductPricingPayload, S>

  type ProductPricingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ProductPricingFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ProductPricingCountAggregateInputType | true
    }

  export interface ProductPricingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ProductPricing'], meta: { name: 'ProductPricing' } }
    /**
     * Find zero or one ProductPricing that matches the filter.
     * @param {ProductPricingFindUniqueArgs} args - Arguments to find a ProductPricing
     * @example
     * // Get one ProductPricing
     * const productPricing = await prisma.productPricing.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProductPricingFindUniqueArgs>(args: SelectSubset<T, ProductPricingFindUniqueArgs<ExtArgs>>): Prisma__ProductPricingClient<$Result.GetResult<Prisma.$ProductPricingPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ProductPricing that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ProductPricingFindUniqueOrThrowArgs} args - Arguments to find a ProductPricing
     * @example
     * // Get one ProductPricing
     * const productPricing = await prisma.productPricing.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProductPricingFindUniqueOrThrowArgs>(args: SelectSubset<T, ProductPricingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProductPricingClient<$Result.GetResult<Prisma.$ProductPricingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ProductPricing that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductPricingFindFirstArgs} args - Arguments to find a ProductPricing
     * @example
     * // Get one ProductPricing
     * const productPricing = await prisma.productPricing.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProductPricingFindFirstArgs>(args?: SelectSubset<T, ProductPricingFindFirstArgs<ExtArgs>>): Prisma__ProductPricingClient<$Result.GetResult<Prisma.$ProductPricingPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ProductPricing that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductPricingFindFirstOrThrowArgs} args - Arguments to find a ProductPricing
     * @example
     * // Get one ProductPricing
     * const productPricing = await prisma.productPricing.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProductPricingFindFirstOrThrowArgs>(args?: SelectSubset<T, ProductPricingFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProductPricingClient<$Result.GetResult<Prisma.$ProductPricingPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ProductPricings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductPricingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ProductPricings
     * const productPricings = await prisma.productPricing.findMany()
     * 
     * // Get first 10 ProductPricings
     * const productPricings = await prisma.productPricing.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const productPricingWithIdOnly = await prisma.productPricing.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ProductPricingFindManyArgs>(args?: SelectSubset<T, ProductPricingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductPricingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ProductPricing.
     * @param {ProductPricingCreateArgs} args - Arguments to create a ProductPricing.
     * @example
     * // Create one ProductPricing
     * const ProductPricing = await prisma.productPricing.create({
     *   data: {
     *     // ... data to create a ProductPricing
     *   }
     * })
     * 
     */
    create<T extends ProductPricingCreateArgs>(args: SelectSubset<T, ProductPricingCreateArgs<ExtArgs>>): Prisma__ProductPricingClient<$Result.GetResult<Prisma.$ProductPricingPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ProductPricings.
     * @param {ProductPricingCreateManyArgs} args - Arguments to create many ProductPricings.
     * @example
     * // Create many ProductPricings
     * const productPricing = await prisma.productPricing.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProductPricingCreateManyArgs>(args?: SelectSubset<T, ProductPricingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ProductPricings and returns the data saved in the database.
     * @param {ProductPricingCreateManyAndReturnArgs} args - Arguments to create many ProductPricings.
     * @example
     * // Create many ProductPricings
     * const productPricing = await prisma.productPricing.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ProductPricings and only return the `id`
     * const productPricingWithIdOnly = await prisma.productPricing.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProductPricingCreateManyAndReturnArgs>(args?: SelectSubset<T, ProductPricingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductPricingPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ProductPricing.
     * @param {ProductPricingDeleteArgs} args - Arguments to delete one ProductPricing.
     * @example
     * // Delete one ProductPricing
     * const ProductPricing = await prisma.productPricing.delete({
     *   where: {
     *     // ... filter to delete one ProductPricing
     *   }
     * })
     * 
     */
    delete<T extends ProductPricingDeleteArgs>(args: SelectSubset<T, ProductPricingDeleteArgs<ExtArgs>>): Prisma__ProductPricingClient<$Result.GetResult<Prisma.$ProductPricingPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ProductPricing.
     * @param {ProductPricingUpdateArgs} args - Arguments to update one ProductPricing.
     * @example
     * // Update one ProductPricing
     * const productPricing = await prisma.productPricing.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProductPricingUpdateArgs>(args: SelectSubset<T, ProductPricingUpdateArgs<ExtArgs>>): Prisma__ProductPricingClient<$Result.GetResult<Prisma.$ProductPricingPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ProductPricings.
     * @param {ProductPricingDeleteManyArgs} args - Arguments to filter ProductPricings to delete.
     * @example
     * // Delete a few ProductPricings
     * const { count } = await prisma.productPricing.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProductPricingDeleteManyArgs>(args?: SelectSubset<T, ProductPricingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ProductPricings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductPricingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ProductPricings
     * const productPricing = await prisma.productPricing.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProductPricingUpdateManyArgs>(args: SelectSubset<T, ProductPricingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ProductPricings and returns the data updated in the database.
     * @param {ProductPricingUpdateManyAndReturnArgs} args - Arguments to update many ProductPricings.
     * @example
     * // Update many ProductPricings
     * const productPricing = await prisma.productPricing.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ProductPricings and only return the `id`
     * const productPricingWithIdOnly = await prisma.productPricing.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ProductPricingUpdateManyAndReturnArgs>(args: SelectSubset<T, ProductPricingUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductPricingPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ProductPricing.
     * @param {ProductPricingUpsertArgs} args - Arguments to update or create a ProductPricing.
     * @example
     * // Update or create a ProductPricing
     * const productPricing = await prisma.productPricing.upsert({
     *   create: {
     *     // ... data to create a ProductPricing
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ProductPricing we want to update
     *   }
     * })
     */
    upsert<T extends ProductPricingUpsertArgs>(args: SelectSubset<T, ProductPricingUpsertArgs<ExtArgs>>): Prisma__ProductPricingClient<$Result.GetResult<Prisma.$ProductPricingPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ProductPricings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductPricingCountArgs} args - Arguments to filter ProductPricings to count.
     * @example
     * // Count the number of ProductPricings
     * const count = await prisma.productPricing.count({
     *   where: {
     *     // ... the filter for the ProductPricings we want to count
     *   }
     * })
    **/
    count<T extends ProductPricingCountArgs>(
      args?: Subset<T, ProductPricingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProductPricingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ProductPricing.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductPricingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ProductPricingAggregateArgs>(args: Subset<T, ProductPricingAggregateArgs>): Prisma.PrismaPromise<GetProductPricingAggregateType<T>>

    /**
     * Group by ProductPricing.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductPricingGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ProductPricingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProductPricingGroupByArgs['orderBy'] }
        : { orderBy?: ProductPricingGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ProductPricingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProductPricingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ProductPricing model
   */
  readonly fields: ProductPricingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ProductPricing.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProductPricingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ProductPricing model
   */
  interface ProductPricingFieldRefs {
    readonly id: FieldRef<"ProductPricing", 'String'>
    readonly productId: FieldRef<"ProductPricing", 'String'>
    readonly basePrice: FieldRef<"ProductPricing", 'Decimal'>
    readonly resellerPrice: FieldRef<"ProductPricing", 'Decimal'>
    readonly commissionRate: FieldRef<"ProductPricing", 'Decimal'>
    readonly minMargin: FieldRef<"ProductPricing", 'Decimal'>
    readonly createdAt: FieldRef<"ProductPricing", 'DateTime'>
    readonly updatedAt: FieldRef<"ProductPricing", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ProductPricing findUnique
   */
  export type ProductPricingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductPricing
     */
    select?: ProductPricingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProductPricing
     */
    omit?: ProductPricingOmit<ExtArgs> | null
    /**
     * Filter, which ProductPricing to fetch.
     */
    where: ProductPricingWhereUniqueInput
  }

  /**
   * ProductPricing findUniqueOrThrow
   */
  export type ProductPricingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductPricing
     */
    select?: ProductPricingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProductPricing
     */
    omit?: ProductPricingOmit<ExtArgs> | null
    /**
     * Filter, which ProductPricing to fetch.
     */
    where: ProductPricingWhereUniqueInput
  }

  /**
   * ProductPricing findFirst
   */
  export type ProductPricingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductPricing
     */
    select?: ProductPricingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProductPricing
     */
    omit?: ProductPricingOmit<ExtArgs> | null
    /**
     * Filter, which ProductPricing to fetch.
     */
    where?: ProductPricingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProductPricings to fetch.
     */
    orderBy?: ProductPricingOrderByWithRelationInput | ProductPricingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ProductPricings.
     */
    cursor?: ProductPricingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProductPricings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProductPricings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ProductPricings.
     */
    distinct?: ProductPricingScalarFieldEnum | ProductPricingScalarFieldEnum[]
  }

  /**
   * ProductPricing findFirstOrThrow
   */
  export type ProductPricingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductPricing
     */
    select?: ProductPricingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProductPricing
     */
    omit?: ProductPricingOmit<ExtArgs> | null
    /**
     * Filter, which ProductPricing to fetch.
     */
    where?: ProductPricingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProductPricings to fetch.
     */
    orderBy?: ProductPricingOrderByWithRelationInput | ProductPricingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ProductPricings.
     */
    cursor?: ProductPricingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProductPricings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProductPricings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ProductPricings.
     */
    distinct?: ProductPricingScalarFieldEnum | ProductPricingScalarFieldEnum[]
  }

  /**
   * ProductPricing findMany
   */
  export type ProductPricingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductPricing
     */
    select?: ProductPricingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProductPricing
     */
    omit?: ProductPricingOmit<ExtArgs> | null
    /**
     * Filter, which ProductPricings to fetch.
     */
    where?: ProductPricingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProductPricings to fetch.
     */
    orderBy?: ProductPricingOrderByWithRelationInput | ProductPricingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ProductPricings.
     */
    cursor?: ProductPricingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProductPricings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProductPricings.
     */
    skip?: number
    distinct?: ProductPricingScalarFieldEnum | ProductPricingScalarFieldEnum[]
  }

  /**
   * ProductPricing create
   */
  export type ProductPricingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductPricing
     */
    select?: ProductPricingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProductPricing
     */
    omit?: ProductPricingOmit<ExtArgs> | null
    /**
     * The data needed to create a ProductPricing.
     */
    data: XOR<ProductPricingCreateInput, ProductPricingUncheckedCreateInput>
  }

  /**
   * ProductPricing createMany
   */
  export type ProductPricingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ProductPricings.
     */
    data: ProductPricingCreateManyInput | ProductPricingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ProductPricing createManyAndReturn
   */
  export type ProductPricingCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductPricing
     */
    select?: ProductPricingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ProductPricing
     */
    omit?: ProductPricingOmit<ExtArgs> | null
    /**
     * The data used to create many ProductPricings.
     */
    data: ProductPricingCreateManyInput | ProductPricingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ProductPricing update
   */
  export type ProductPricingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductPricing
     */
    select?: ProductPricingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProductPricing
     */
    omit?: ProductPricingOmit<ExtArgs> | null
    /**
     * The data needed to update a ProductPricing.
     */
    data: XOR<ProductPricingUpdateInput, ProductPricingUncheckedUpdateInput>
    /**
     * Choose, which ProductPricing to update.
     */
    where: ProductPricingWhereUniqueInput
  }

  /**
   * ProductPricing updateMany
   */
  export type ProductPricingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ProductPricings.
     */
    data: XOR<ProductPricingUpdateManyMutationInput, ProductPricingUncheckedUpdateManyInput>
    /**
     * Filter which ProductPricings to update
     */
    where?: ProductPricingWhereInput
    /**
     * Limit how many ProductPricings to update.
     */
    limit?: number
  }

  /**
   * ProductPricing updateManyAndReturn
   */
  export type ProductPricingUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductPricing
     */
    select?: ProductPricingSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ProductPricing
     */
    omit?: ProductPricingOmit<ExtArgs> | null
    /**
     * The data used to update ProductPricings.
     */
    data: XOR<ProductPricingUpdateManyMutationInput, ProductPricingUncheckedUpdateManyInput>
    /**
     * Filter which ProductPricings to update
     */
    where?: ProductPricingWhereInput
    /**
     * Limit how many ProductPricings to update.
     */
    limit?: number
  }

  /**
   * ProductPricing upsert
   */
  export type ProductPricingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductPricing
     */
    select?: ProductPricingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProductPricing
     */
    omit?: ProductPricingOmit<ExtArgs> | null
    /**
     * The filter to search for the ProductPricing to update in case it exists.
     */
    where: ProductPricingWhereUniqueInput
    /**
     * In case the ProductPricing found by the `where` argument doesn't exist, create a new ProductPricing with this data.
     */
    create: XOR<ProductPricingCreateInput, ProductPricingUncheckedCreateInput>
    /**
     * In case the ProductPricing was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProductPricingUpdateInput, ProductPricingUncheckedUpdateInput>
  }

  /**
   * ProductPricing delete
   */
  export type ProductPricingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductPricing
     */
    select?: ProductPricingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProductPricing
     */
    omit?: ProductPricingOmit<ExtArgs> | null
    /**
     * Filter which ProductPricing to delete.
     */
    where: ProductPricingWhereUniqueInput
  }

  /**
   * ProductPricing deleteMany
   */
  export type ProductPricingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ProductPricings to delete
     */
    where?: ProductPricingWhereInput
    /**
     * Limit how many ProductPricings to delete.
     */
    limit?: number
  }

  /**
   * ProductPricing without action
   */
  export type ProductPricingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductPricing
     */
    select?: ProductPricingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProductPricing
     */
    omit?: ProductPricingOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const ProductPricingScalarFieldEnum: {
    id: 'id',
    productId: 'productId',
    basePrice: 'basePrice',
    resellerPrice: 'resellerPrice',
    commissionRate: 'commissionRate',
    minMargin: 'minMargin',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ProductPricingScalarFieldEnum = (typeof ProductPricingScalarFieldEnum)[keyof typeof ProductPricingScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'Decimal[]'
   */
  export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    
  /**
   * Deep Input Types
   */


  export type ProductPricingWhereInput = {
    AND?: ProductPricingWhereInput | ProductPricingWhereInput[]
    OR?: ProductPricingWhereInput[]
    NOT?: ProductPricingWhereInput | ProductPricingWhereInput[]
    id?: StringFilter<"ProductPricing"> | string
    productId?: StringFilter<"ProductPricing"> | string
    basePrice?: DecimalFilter<"ProductPricing"> | Decimal | DecimalJsLike | number | string
    resellerPrice?: DecimalFilter<"ProductPricing"> | Decimal | DecimalJsLike | number | string
    commissionRate?: DecimalFilter<"ProductPricing"> | Decimal | DecimalJsLike | number | string
    minMargin?: DecimalNullableFilter<"ProductPricing"> | Decimal | DecimalJsLike | number | string | null
    createdAt?: DateTimeFilter<"ProductPricing"> | Date | string
    updatedAt?: DateTimeFilter<"ProductPricing"> | Date | string
  }

  export type ProductPricingOrderByWithRelationInput = {
    id?: SortOrder
    productId?: SortOrder
    basePrice?: SortOrder
    resellerPrice?: SortOrder
    commissionRate?: SortOrder
    minMargin?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProductPricingWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    productId?: string
    AND?: ProductPricingWhereInput | ProductPricingWhereInput[]
    OR?: ProductPricingWhereInput[]
    NOT?: ProductPricingWhereInput | ProductPricingWhereInput[]
    basePrice?: DecimalFilter<"ProductPricing"> | Decimal | DecimalJsLike | number | string
    resellerPrice?: DecimalFilter<"ProductPricing"> | Decimal | DecimalJsLike | number | string
    commissionRate?: DecimalFilter<"ProductPricing"> | Decimal | DecimalJsLike | number | string
    minMargin?: DecimalNullableFilter<"ProductPricing"> | Decimal | DecimalJsLike | number | string | null
    createdAt?: DateTimeFilter<"ProductPricing"> | Date | string
    updatedAt?: DateTimeFilter<"ProductPricing"> | Date | string
  }, "id" | "productId">

  export type ProductPricingOrderByWithAggregationInput = {
    id?: SortOrder
    productId?: SortOrder
    basePrice?: SortOrder
    resellerPrice?: SortOrder
    commissionRate?: SortOrder
    minMargin?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ProductPricingCountOrderByAggregateInput
    _avg?: ProductPricingAvgOrderByAggregateInput
    _max?: ProductPricingMaxOrderByAggregateInput
    _min?: ProductPricingMinOrderByAggregateInput
    _sum?: ProductPricingSumOrderByAggregateInput
  }

  export type ProductPricingScalarWhereWithAggregatesInput = {
    AND?: ProductPricingScalarWhereWithAggregatesInput | ProductPricingScalarWhereWithAggregatesInput[]
    OR?: ProductPricingScalarWhereWithAggregatesInput[]
    NOT?: ProductPricingScalarWhereWithAggregatesInput | ProductPricingScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ProductPricing"> | string
    productId?: StringWithAggregatesFilter<"ProductPricing"> | string
    basePrice?: DecimalWithAggregatesFilter<"ProductPricing"> | Decimal | DecimalJsLike | number | string
    resellerPrice?: DecimalWithAggregatesFilter<"ProductPricing"> | Decimal | DecimalJsLike | number | string
    commissionRate?: DecimalWithAggregatesFilter<"ProductPricing"> | Decimal | DecimalJsLike | number | string
    minMargin?: DecimalNullableWithAggregatesFilter<"ProductPricing"> | Decimal | DecimalJsLike | number | string | null
    createdAt?: DateTimeWithAggregatesFilter<"ProductPricing"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ProductPricing"> | Date | string
  }

  export type ProductPricingCreateInput = {
    id?: string
    productId: string
    basePrice: Decimal | DecimalJsLike | number | string
    resellerPrice: Decimal | DecimalJsLike | number | string
    commissionRate: Decimal | DecimalJsLike | number | string
    minMargin?: Decimal | DecimalJsLike | number | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ProductPricingUncheckedCreateInput = {
    id?: string
    productId: string
    basePrice: Decimal | DecimalJsLike | number | string
    resellerPrice: Decimal | DecimalJsLike | number | string
    commissionRate: Decimal | DecimalJsLike | number | string
    minMargin?: Decimal | DecimalJsLike | number | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ProductPricingUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    basePrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    resellerPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    commissionRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    minMargin?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProductPricingUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    basePrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    resellerPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    commissionRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    minMargin?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProductPricingCreateManyInput = {
    id?: string
    productId: string
    basePrice: Decimal | DecimalJsLike | number | string
    resellerPrice: Decimal | DecimalJsLike | number | string
    commissionRate: Decimal | DecimalJsLike | number | string
    minMargin?: Decimal | DecimalJsLike | number | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ProductPricingUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    basePrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    resellerPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    commissionRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    minMargin?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProductPricingUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    basePrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    resellerPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    commissionRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    minMargin?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type DecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type DecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ProductPricingCountOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    basePrice?: SortOrder
    resellerPrice?: SortOrder
    commissionRate?: SortOrder
    minMargin?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProductPricingAvgOrderByAggregateInput = {
    basePrice?: SortOrder
    resellerPrice?: SortOrder
    commissionRate?: SortOrder
    minMargin?: SortOrder
  }

  export type ProductPricingMaxOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    basePrice?: SortOrder
    resellerPrice?: SortOrder
    commissionRate?: SortOrder
    minMargin?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProductPricingMinOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    basePrice?: SortOrder
    resellerPrice?: SortOrder
    commissionRate?: SortOrder
    minMargin?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProductPricingSumOrderByAggregateInput = {
    basePrice?: SortOrder
    resellerPrice?: SortOrder
    commissionRate?: SortOrder
    minMargin?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type DecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type NullableDecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string | null
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type NestedDecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type NestedDecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}