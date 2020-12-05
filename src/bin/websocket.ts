async function bootStrap() {
    await require("../module/init/preinstall")();
    await require("../module/init/build_env")();
    require("../bin/main");
}

bootStrap();
