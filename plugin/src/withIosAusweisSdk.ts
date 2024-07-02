import type { ConfigPlugin } from "@expo/config-plugins";

import path from "node:path";
import fs from "node:fs/promises";
import { withDangerousMod } from "@expo/config-plugins";
import {
	mergeContents,
	MergeResults,
} from "@expo/config-plugins/build/utils/generateCode";

const podSource = `pod 'AusweisApp2', :path => File.join(File.dirname(\`node --print "require.resolve('@animo-id/expo-ausweis-sdk/package.json')"\`), "ios/Specs")`;

export function addAusweisApp2Pod(src: string): MergeResults {
	return mergeContents({
		tag: "@animo-id/expo-ausweis-sdk",
		src,
		newSrc: podSource,
		anchor: /use_native_modules/,
		offset: 0,
		comment: "#",
	});
}

const withIosAusweisApp2Pod: ConfigPlugin = (config) => {
	return withDangerousMod(config, [
		"ios",
		async (config) => {
			const filePath = path.join(
				config.modRequest.platformProjectRoot,
				"Podfile",
			);
			const contents = await fs.readFile(filePath, "utf-8");
			const results = addAusweisApp2Pod(contents);

			if (!results.didMerge) {
				console.log(
					"ERROR: Cannot add AusweisApp2 to the project's ios/Podfile because it's malformed. Please report this with a copy of your project Podfile.",
				);
				return config;
			}

			await fs.writeFile(filePath, results.contents);
			return config;
		},
	]);
};

const withIosAusweisSdk: ConfigPlugin = (config) => {
	return withIosAusweisApp2Pod(config);
};

export { withIosAusweisSdk };
