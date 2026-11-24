export class BroadcastManager {
    /**
     * 广播信息
     * @param userArr 用户Socket数组
     * @param type 发送信息类型
     * @param value 发送对象
     * @param dimension 数组维度
     * @param privilege 权限限制
     */
    sendMessage(userArr: any, type: string, value: any, dimension = 2, privilege = false) {
        if (!userArr) {
            return;
        }
        if (dimension > 1) {
            for (const key in userArr) {
                if (Object.prototype.hasOwnProperty.call(userArr, key)) {
                    this.sendMessage(userArr[key], type, value, dimension - 1, privilege);
                }
                else {
                    delete userArr[key];
                }
            }
        }
        else if (dimension === 1) {
            for (let i in userArr) {
                if (!Object.prototype.hasOwnProperty.call(userArr, i) || null === userArr[i] || (userArr[i].url && userArr[i].url.indexOf("monitor") !== -1)) {
                    continue;
                }
                if (!privilege || userArr[i].privilege) {
                    userArr[i].emit(type, value);
                }
            }
        }
    }
}

export default new BroadcastManager();
