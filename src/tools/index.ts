import { NestJSTestGeneratorTool } from "./NestJSTestGeneratorTool";

import { OdataTestGeneratorTool } from "./OdataTestGeneratorTool";

export const toolFactory = {
  nestjs_test_generator: NestJSTestGeneratorTool,
  odata_test_generator: OdataTestGeneratorTool,
} as any;
