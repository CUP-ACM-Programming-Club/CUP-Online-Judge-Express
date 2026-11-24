process.on("unhandledRejection", (error) => {
    // without a handler Node terminates the process, dropping every socket and in-flight judge state
    console.log("unhandledRejection", error);
});

async function bootStrap() {
    global.currentDaemonName = "websocket";
    await require("../main/init/preinstall")();
    await require("../main/init/build_env")();
    require("./main");
}

bootStrap();
