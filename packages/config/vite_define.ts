const exportEnv = (...names: string[]) => {
    return Object.fromEntries(names.map((name) => [
        `import.meta.env.${name}`,
        process.env[name] ? JSON.stringify(process.env[name]) : "undefined",
    ]))
}

export default exportEnv("WEB_CLIENT_BASE_PATH", "SERVER_HOST");
