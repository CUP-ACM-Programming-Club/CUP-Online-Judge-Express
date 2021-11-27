async function bootStrap() {
    global.currentDaemonName = "websocket";
    await require("../module/init/preinstall")();
    await require("../module/init/build_env")();
    require("../bin/main");
}

bootStrap();
