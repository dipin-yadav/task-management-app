/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "task-management-app",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    const databaseUrl = new sst.Secret("DATABASE_URL");
    const nextAuthSecret = new sst.Secret("NEXTAUTH_SECRET");
    const nextAuthUrl = new sst.Secret("NEXTAUTH_URL");

    new sst.aws.Nextjs("TaskManager", {
      environment: {
        DATABASE_URL: databaseUrl.value,
        NEXTAUTH_SECRET: nextAuthSecret.value,
        NEXTAUTH_URL: nextAuthUrl.value,
      },
    });
  },
});
