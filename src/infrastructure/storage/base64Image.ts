import fs from "fs";
import path from "path";

// 本地替代 base64-img（该包已停止维护且依赖链存在严重漏洞）。
// 行为与 base64-img@1.0.4 的 base64()/img() 保持一致。

/**
 * 读取图片文件，返回 data URI。
 * 与 base64-img 一致：MIME 子类型直接取扩展名（不做大小写转换），
 * 无扩展名时用 png，svg 映射为 svg+xml。
 */
export async function imageFileToDataUri(filename: string): Promise<string> {
    const data = await fs.promises.readFile(filename);
    let extname = path.extname(filename).substr(1);
    extname = extname || "png";
    if (extname === "svg") {
        extname = "svg+xml";
    }
    return "data:image/" + extname + ";base64," + data.toString("base64");
}

/**
 * 将 data URI 写成图片文件 `${destpath}/${name}${ext}`，返回写入路径。
 * 与 base64-img 一致：jpeg 存为 .jpg，svg+xml 存为 .svg，其余用 MIME 子类型作扩展名；
 * 格式不合法时抛出 "image base64 data error"；目标目录不存在时自动创建。
 */
export async function dataUriToImageFile(data: string, destpath: string, name: string): Promise<string> {
    const match = data.match(/^data:image\/([\w+]+);base64,([\s\S]+)/);
    if (!match) {
        throw new Error("image base64 data error");
    }
    const baseType: { [key: string]: string } = {
        jpeg: "jpg",
        "svg+xml": "svg"
    };
    const extname = "." + (baseType[match[1]] ? baseType[match[1]] : match[1]);
    const filepath = path.join(destpath, name + extname);
    await fs.promises.mkdir(path.dirname(filepath), { recursive: true });
    await fs.promises.writeFile(filepath, match[2], { encoding: "base64" });
    return filepath;
}
