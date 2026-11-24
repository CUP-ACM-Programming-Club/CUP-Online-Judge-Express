process.on("unhandledRejection", (error) => {
    // without a handler Node terminates the process, dropping every socket and in-flight judge state
    console.log("unhandledRejection", error);
});

async function bootStrap() {
    global.currentDaemonName = "websocket";
    await require("../module/init/preinstall")();
    await require("../module/init/build_env")();
    require("./main");
}

bootStrap();
