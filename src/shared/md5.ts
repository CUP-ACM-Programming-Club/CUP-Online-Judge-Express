import crypt from "crypto"

export default function md5(data: string): string {
    // 以md5的格式创建一个哈希值
    let hash = crypt.createHash("md5");
    return hash.update(data).digest("base64");
}
