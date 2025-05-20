import child_process from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { compareNodeVersions } from "../src/utils.ts";

const supportImportAttributes =
  compareNodeVersions(process.version, "v18.20.0") >= 0;

const exec = promisify(child_process.exec);
const registerUrl = pathToFileURL(
  path.resolve(process.cwd(), "dist/register.js"),
).href;

describe("Glob Loader", () => {
  const defaultMainPath = path.resolve(process.cwd(), "tests/fixtures/main.js");
  const parentSubMainPath = path.resolve(
    process.cwd(),
    "tests/fixtures/parent/sub/main.js",
  );
  let mainPath = defaultMainPath;

  beforeEach(() => {
    mainPath = defaultMainPath;
  });

  afterAll(async () => {
    await Promise.all([
      fs.writeFile(defaultMainPath, ""),
      fs.writeFile(parentSubMainPath, ""),
    ]);
  });

  it("should static import lazily with '?glob'", async () => {
    const fileContent = `
			import modules from "./basic/*.js?glob";
			console.log(modules);
			const promises = Object.values(modules).map(module => module());
			const results = await Promise.all(promises);
			results.forEach(result => console.log(result));
		`;
    await fs.writeFile(mainPath, fileContent);

    const { stdout } = await exec(
      `node --import="${registerUrl}" "${mainPath}"`,
    );
    expect(stdout.toString()).toMatchSnapshot();
  });

  it("should static import eagerly with '?glob&eager'", async () => {
    const fileContent = `
			import modules from "./basic/*.js?glob&eager";
			console.log(modules);
		`;
    await fs.writeFile(mainPath, fileContent);

    const { stdout } = await exec(
      `node --import="${registerUrl}" "${mainPath}"`,
    );
    expect(stdout.toString()).toMatchSnapshot();
  });

  it("should dynamic import() lazily with '?glob'", async () => {
    const fileContent = `
			import("./basic/*.js?glob").then(async (modules) => {
				console.log(modules.default);
				const promises = Object.values(modules.default).map(service => service());
				const results = await Promise.all(promises);
				results.forEach(result => console.log(result));
			});
		`;
    await fs.writeFile(mainPath, fileContent);

    const { stdout } = await exec(
      `node --import="${registerUrl}" "${mainPath}"`,
    );
    expect(stdout.toString()).toMatchSnapshot();
  });

  it("should dynamic import() eagerly with '?glob&eager'", async () => {
    const fileContent = `
			import("./basic/*.js?glob&eager").then((modules) => {
				console.log(modules.default);
			});
		`;
    await fs.writeFile(mainPath, fileContent);

    const { stdout } = await exec(
      `node --import="${registerUrl}" "${mainPath}"`,
    );
    expect(stdout.toString()).toMatchSnapshot();
  });

  it("should eagerly load nested (**) modules with '?glob&eager'", async () => {
    const fileContent = `
			import modules from "./nested/**/*.js?glob&eager";
			console.log(modules);
		`;
    await fs.writeFile(mainPath, fileContent);

    const { stdout } = await exec(
      `node --import="${registerUrl}" "${mainPath}"`,
    );
    expect(stdout.toString()).toMatchSnapshot();
  });

  it("should eagerly load empty directory as empty object with '?glob&eager'", async () => {
    const fileContent = `
			import modules from "./empty/*.js?glob&eager";
			console.log(modules);
		`;
    await fs.writeFile(mainPath, fileContent);

    const { stdout } = await exec(
      `node --import="${registerUrl}" "${mainPath}"`,
    );
    expect(stdout.toString()).toMatchSnapshot();
  });

  it("should eagerly load non-existent path as empty object with '?glob&eager'", async () => {
    const fileContent = `
			import modules from "./non-exist/*.js?glob&eager";
			console.log(modules);
		`;
    await fs.writeFile(mainPath, fileContent);

    const { stdout } = await exec(
      `node --import="${registerUrl}" "${mainPath}"`,
    );
    expect(stdout.toString()).toMatchSnapshot();
  });

  it.skipIf(!supportImportAttributes)(
    "should eagerly load JSON modules with '?glob&eager' and import attributes",
    async () => {
      const fileContent = `
			import modules from "./json/*.json?glob&eager" with { type: "json" };
			console.log(modules);
		`;
      await fs.writeFile(mainPath, fileContent);

      const { stdout } = await exec(
        `node --import="${registerUrl}" "${mainPath}"`,
      );
      expect(stdout.toString()).toMatchSnapshot();
    },
  );

  it("should eagerly load parent ('../') modules with '?glob&eager'", async () => {
    mainPath = parentSubMainPath;
    const fileContent = `
			import modules from "../*.js?glob&eager";
			console.log(modules);
		`;
    await fs.writeFile(mainPath, fileContent);

    const { stdout } = await exec(
      `node --import="${registerUrl}" "${mainPath}"`,
    );
    expect(stdout.toString()).toMatchSnapshot();
  });

  it("should static import lazily with '?glob&import=default'", async () => {
    const fileContent = `
			import modules from "./basic/*.js?glob&import=default";
			console.log(modules);
			const promises = Object.values(modules).map(moduleDefaultExport => moduleDefaultExport());
			const results = await Promise.all(promises);
			results.forEach(result => console.log(result));
		`;
    await fs.writeFile(mainPath, fileContent);
    const { stdout } = await exec(
      `node --import="${registerUrl}" "${mainPath}"`,
    );
    expect(stdout.toString()).toMatchSnapshot();
  });

  it("should static import eagerly with '?glob&eager&import=default'", async () => {
    const fileContent = `
			import modules from "./basic/*.js?glob&eager&import=default";
			console.log(modules);
		`;
    await fs.writeFile(mainPath, fileContent);
    const { stdout } = await exec(
      `node --import="${registerUrl}" "${mainPath}"`,
    );
    expect(stdout.toString()).toMatchSnapshot();
  });

  it("should static import lazily with '?glob&import=name'", async () => {
    const fileContent = `
			import modules from "./basic/*.js?glob&import=name";
			console.log(modules);
			const promises = Object.values(modules).map(moduleNamedExport => moduleNamedExport());
			const results = await Promise.all(promises);
			results.forEach(result => console.log(result));
		`;
    await fs.writeFile(mainPath, fileContent);
    const { stdout } = await exec(
      `node --import="${registerUrl}" "${mainPath}"`,
    );
    expect(stdout.toString()).toMatchSnapshot();
  });

  it("should static import eagerly with '?glob&eager&import=name'", async () => {
    const fileContent = `
			import modules from "./basic/*.js?glob&eager&import=name";
			console.log(modules);
		`;
    await fs.writeFile(mainPath, fileContent);
    const { stdout } = await exec(
      `node --import="${registerUrl}" "${mainPath}"`,
    );
    expect(stdout.toString()).toMatchSnapshot();
  });

  it("should dynamic import() lazily with '?glob&import=default'", async () => {
    const fileContent = `
			import("./basic/*.js?glob&import=default").then(async (modules) => {
				console.log(modules.default);
				const promises = Object.values(modules.default).map(moduleDefaultExport => moduleDefaultExport());
				const results = await Promise.all(promises);
				results.forEach(result => console.log(result));
			});
		`;
    await fs.writeFile(mainPath, fileContent);
    const { stdout } = await exec(
      `node --import="${registerUrl}" "${mainPath}"`,
    );
    expect(stdout.toString()).toMatchSnapshot();
  });

  it("should dynamic import() eagerly with '?glob&eager&import=default'", async () => {
    const fileContent = `
			import("./basic/*.js?glob&eager&import=default").then((modules) => {
				console.log(modules.default);
			});
		`;
    await fs.writeFile(mainPath, fileContent);
    const { stdout } = await exec(
      `node --import="${registerUrl}" "${mainPath}"`,
    );
    expect(stdout.toString()).toMatchSnapshot();
  });

  it("should dynamic import() lazily with '?glob&import=name'", async () => {
    const fileContent = `
			import("./basic/*.js?glob&import=name").then(async (modules) => {
				console.log(modules.default);
				const promises = Object.values(modules.default).map(moduleNamedExport => moduleNamedExport());
				const results = await Promise.all(promises);
				results.forEach(result => console.log(result));
			});
		`;
    await fs.writeFile(mainPath, fileContent);
    const { stdout } = await exec(
      `node --import="${registerUrl}" "${mainPath}"`,
    );
    expect(stdout.toString()).toMatchSnapshot();
  });

  it("should dynamic import() eagerly with '?glob&eager&import=name'", async () => {
    const fileContent = `
			import("./basic/*.js?glob&eager&import=name").then((modules) => {
				console.log(modules.default);
			});
		`;
    await fs.writeFile(mainPath, fileContent);
    const { stdout } = await exec(
      `node --import="${registerUrl}" "${mainPath}"`,
    );
    expect(stdout.toString()).toMatchSnapshot();
  });

  // YAML import tests
  it("should static import YAML lazily with '?glob'", async () => {
    const fileContent = `
      import modules from "./yaml/*.yaml?glob";
      console.log(modules);
      const promises = Object.keys(modules).map(key => modules[key]());
      const results = await Promise.all(promises);
      results.forEach(result => console.log(result));
    `;
    await fs.writeFile(mainPath, fileContent);
    const { stdout } = await exec(
      `node --import="${registerUrl}" "${mainPath}"`,
    );
    expect(stdout.toString()).toMatchSnapshot();
  });

  it("should static import YAML eagerly with '?glob&eager'", async () => {
    const fileContent = `
      import modules from "./yaml/*.yaml?glob&eager";
      console.log(modules);
    `;
    await fs.writeFile(mainPath, fileContent);
    const { stdout } = await exec(
      `node --import="${registerUrl}" "${mainPath}"`,
    );
    expect(stdout.toString()).toMatchSnapshot();
  });

  it("should static import YAML lazily with '?glob&import=name'", async () => {
    const fileContent = `
      import modules from "./yaml/*.yaml?glob&import=name";
      console.log(modules);
      const promises = Object.keys(modules).map(key => modules[key]());
      const results = await Promise.all(promises);
      results.forEach(result => console.log(result));
    `;
    await fs.writeFile(mainPath, fileContent);
    const { stdout } = await exec(
      `node --import="${registerUrl}" "${mainPath}"`,
    );
    expect(stdout.toString()).toMatchSnapshot();
  });

  it("should static import YAML eagerly with '?glob&eager&import=role'", async () => {
    const fileContent = `
      // user.yaml has 'role', config.yaml does not, so config should be undefined for this key.
      import modules from "./yaml/*.yaml?glob&eager&import=role";
      console.log(modules);
    `;
    await fs.writeFile(mainPath, fileContent);
    const { stdout } = await exec(
      `node --import="${registerUrl}" "${mainPath}"`,
    );
    expect(stdout.toString()).toMatchSnapshot();
  });

  it("should static import YAML eagerly with '?glob&eager&import=default'", async () => {
    const fileContent = `
      import modules from "./yaml/*.yaml?glob&eager&import=default";
      console.log(modules);
    `;
    await fs.writeFile(mainPath, fileContent);
    const { stdout } = await exec(
      `node --import="${registerUrl}" "${mainPath}"`,
    );
    expect(stdout.toString()).toMatchSnapshot();
  });

  // Dynamic imports for YAML
  it("should dynamic import() YAML lazily with '?glob'", async () => {
    const fileContent = `
      import("./yaml/*.yaml?glob").then(async (modules) => {
        console.log(modules.default);
        const promises = Object.keys(modules.default).map(key => modules.default[key]());
        const results = await Promise.all(promises);
        results.forEach(result => console.log(result));
      });
    `;
    await fs.writeFile(mainPath, fileContent);
    const { stdout } = await exec(
      `node --import="${registerUrl}" "${mainPath}"`,
    );
    expect(stdout.toString()).toMatchSnapshot();
  });

  it("should dynamic import() YAML eagerly with '?glob&eager'", async () => {
    const fileContent = `
      import("./yaml/*.yaml?glob&eager").then((modules) => {
        console.log(modules.default);
      });
    `;
    await fs.writeFile(mainPath, fileContent);
    const { stdout } = await exec(
      `node --import="${registerUrl}" "${mainPath}"`,
    );
    expect(stdout.toString()).toMatchSnapshot();
  });

  it("should dynamic import() YAML lazily with '?glob&import=port'", async () => {
    const fileContent = `
      import("./yaml/*.yaml?glob&import=port").then(async (modules) => {
        console.log(modules.default);
        const promises = Object.keys(modules.default).map(key => modules.default[key]());
        const results = await Promise.all(promises);
        results.forEach(result => console.log(result));
      });
    `;
    await fs.writeFile(mainPath, fileContent);
    const { stdout } = await exec(
      `node --import="${registerUrl}" "${mainPath}"`,
    );
    expect(stdout.toString()).toMatchSnapshot();
  });

  it("should dynamic import() YAML eagerly with '?glob&eager&import=permissions'", async () => {
    const fileContent = `
      import("./yaml/*.yaml?glob&eager&import=permissions").then((modules) => {
        console.log(modules.default);
      });
    `;
    await fs.writeFile(mainPath, fileContent);
    const { stdout } = await exec(
      `node --import="${registerUrl}" "${mainPath}"`,
    );
    expect(stdout.toString()).toMatchSnapshot();
  });
});
