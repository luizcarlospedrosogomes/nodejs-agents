import { NestJSTestGeneratorTool } from "./NestJSTestGeneratorTool";

import { OdataTestGeneratorTool } from "./OdataTestGeneratorTool";

export const toolFactory = {
  nestjs: NestJSTestGeneratorTool,
  odata: OdataTestGeneratorTool,
} as any;
