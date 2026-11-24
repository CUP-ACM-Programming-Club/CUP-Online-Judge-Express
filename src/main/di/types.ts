const TYPES = {
    ConfigService: Symbol.for("ConfigService"),
    AccountService: Symbol.for("AccountService"),
    RedisService: Symbol.for("RedisService"),
    AuthService: Symbol.for("AuthService"),
    RegisterService: Symbol.for("RegisterService"),
    UserManager: Symbol.for("UserManager"),
    TokenManager: Symbol.for("TokenManager") // Example future service
};

export { TYPES };
