import node from "@prisma/composer/node";
import { secretString } from "@prisma/composer/arktype";
import { type } from "arktype";
import { compute } from "@prisma/composer-prisma-cloud";

export default compute({
  name: "app",
  deps: {
  },
  input: type({
    databaseUrl: secretString(),
  }),
  build: node({ module: import.meta.url, entry: "./dist/server.mjs" }),
});
