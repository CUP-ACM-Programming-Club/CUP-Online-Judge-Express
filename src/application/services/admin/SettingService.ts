import { globalSettingRepository } from "../../ports/GlobalSettingRepository";

class SettingService {
    async getSetting(label: any = []) {
        if (label.length === 0) {
            return await globalSettingRepository.findAll();
        }
        return await globalSettingRepository.findByLabels(label);
    }

    async setSetting(label: string, value: string) {
        if (typeof label !== "string" || typeof value !== "string") {
            return false;
        }
        await globalSettingRepository.setValue(label, value);
        return true;
    }
}

export default new SettingService();
