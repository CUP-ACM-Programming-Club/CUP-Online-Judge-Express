/**
 * problem 领域新拆出的用例/控制器：端口绑定内存假实现，不碰数据库和文件系统。
 */
import { expect } from "chai";
import { PortHarness } from "../helpers/problem-port-harness";
import { PrefileCode, PrefileRow, problemPrefileRepository, ProblemPrefileRepository } from "../../application/ports/ProblemPrefileRepository";
import { problemDataStorage, ProblemDataStorage, UploadedProblemFile } from "../../application/ports/ProblemDataStorage";
import { tutorialRepository } from "../../application/ports/TutorialRepository";
import { specialSubjectRepository } from "../../application/ports/SpecialSubjectRepository";
import ProblemPrefileController from "../../interfaces/http/controllers/ProblemPrefileController";
import ProblemDataController from "../../interfaces/http/controllers/ProblemDataController";
import TutorialController from "../../interfaces/http/controllers/TutorialController";
import ProblemDataUseCases from "../../application/problem/ProblemDataUseCases";
import SpecialSubjectUseCases from "../../application/problem/SpecialSubjectUseCases";

class InMemoryPrefileRepository implements ProblemPrefileRepository {
	rows: PrefileRow[] = [];
	async findByProblem(problemId: number | string, prepend: number) {
		return this.rows.filter(r => String(r.problem_id) === String(problemId) && r.prepend === prepend);
	}
	async insert(problemId: number | string, prepend: number, code: PrefileCode) {
		this.rows.push({ problem_id: Number(problemId), prepend, code: code.code, type: code.language });
	}
	async deleteByProblem(problemId: number | string, prepend: number) {
		this.rows = this.rows.filter(r => !(String(r.problem_id) === String(problemId) && r.prepend === prepend));
	}
}

class InMemoryDataStorage implements ProblemDataStorage {
	files = new Map<string, string[]>();
	touched: string[] = [];
	getProblemPath(problemId: string | number) { return `/data/${problemId}`; }
	getFilePath(problemId: string | number, fileName: string) { return `/data/${problemId}/${fileName}`; }
	async setSingleFile(problemId: string, file: UploadedProblemFile) {
		this.files.set(problemId, [...(this.files.get(problemId) || []), file.originalname]);
	}
	async touchFolder(problemId: string) { this.touched.push(problemId); }
	async removeFile(problemId: string, fileName: string) {
		const list = this.files.get(problemId) || [];
		if (!list.includes(fileName)) throw new Error(`ENOENT: ${fileName}`);
		this.files.set(problemId, list.filter(f => f !== fileName));
	}
	async listFiles(problemId: string | number) { return this.files.get(String(problemId)) || []; }
}

describe("problem 领域用例（端口假实现）", function () {
	const ports = new PortHarness();
	afterEach(() => ports.restore());

	it("前置/后置代码：整体替换后按语言读回，返回结构与重构前一致", async () => {
		const repo = new InMemoryPrefileRepository();
		ports.bind(problemPrefileRepository, repo);
		repo.rows.push({ problem_id: 1000, prepend: 1, code: "old", type: 0 });
		const set = await ProblemPrefileController.setPrependCode({ problemId: 1000, payload: [{ language: 1, code: "#include" }, { language: 3, code: "import" }] });
		expect(set).to.deep.equal({ status: "OK", data: undefined });
		expect(await ProblemPrefileController.getPrependCode(1000)).to.deep.equal({
			status: "OK",
			data: { problemId: 1000, payload: [{ language: 1, code: "#include" }, { language: 3, code: "import" }] }
		});
		expect(await ProblemPrefileController.getAppendCode(1000)).to.deep.equal({ status: "OK", data: { problemId: 1000, payload: [] } });
	});

	it("前置代码 payload 缺失时返回 error（与重构前一样先删后报错）", async () => {
		const repo = new InMemoryPrefileRepository();
		ports.bind(problemPrefileRepository, repo);
		repo.rows.push({ problem_id: 1000, prepend: 0, code: "old", type: 0 });
		const res: any = await ProblemPrefileController.setAppendCode({ problemId: 1000 } as any);
		expect(res.status).to.equal("error");
		expect(repo.rows).to.have.lengthOf(0);
	});

	it("数据文件：多文件上传、列出测试数据、删除不存在的文件报错", async () => {
		const storage = new InMemoryDataStorage();
		ports.bind(problemDataStorage, storage);
		const upload = await ProblemDataController.setMultipleFiles({
			params: { problemId: "1000" },
			files: ["1.in", "1.out", "spj.cc", "ac", "spj.tar.gz", "readme.md"].map(n => ({ originalname: n, path: `/tmp/${n}` }))
		} as any);
		expect(upload).to.deep.equal({ status: "OK", data: [undefined, undefined, undefined, undefined, undefined, undefined] });
		expect(storage.touched).to.have.lengthOf(6);
		expect(await ProblemDataUseCases.listJudgeFiles(1000)).to.deep.equal(["1.in", "1.out", "spj.cc"]);
		expect(ProblemDataUseCases.getFilePath("1000", "1.in")).to.equal("/data/1000/1.in");
		expect(await ProblemDataController.removeFile({ params: { problemId: "1000", fileName: "1.in" } } as any)).to.deep.equal({ status: "OK", data: undefined });
		expect(await ProblemDataController.removeFile({ params: { problemId: "1000", fileName: "nope" } } as any)).to.deep.equal({ status: "error", statement: "ENOENT: nope" });
	});

	it("用户题解列表与专题列表", async () => {
		ports.bind(tutorialRepository, { findTutorialListByUserId: async (u: string) => [{ tutorial_id: 1, title: `t-${u}`, problem_id: 1000 }] } as any);
		ports.bind(specialSubjectRepository, { findActive: async () => [{ topic_id: 1 }] });
		expect(await TutorialController.getTutorialListByUserId("u1")).to.deep.equal({ status: "OK", data: [{ tutorial_id: 1, title: "t-u1", problem_id: 1000 }] });
		expect(await SpecialSubjectUseCases.listActive()).to.deep.equal([{ topic_id: 1 }]);
	});
});
