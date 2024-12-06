use clap::Parser;
use std::env;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Parser)]
struct Cli {
    /// Input C header file
    input: String,
    /// Output C# file
    #[arg(short, long)]
    output: String,
}

fn main() {
    let cli = Cli::parse();

    let temp_filename = format!(
        "bindgen_{}.rs",
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis()
    );
    let temp_path = env::temp_dir().join(temp_filename);

    bindgen::Builder::default()
        .header(&cli.input)
        .allowlist_file(&cli.input)
        .generate()
        .expect("Unable to generate bindings")
        .write_to_file(&temp_path)
        .expect("Unable to write bindings");

    csbindgen::Builder::default()
        .input_bindgen_file(&temp_path)
        .csharp_dll_name("gitcg")
        .csharp_namespace("GiTcg")
        .csharp_class_name("NativeMethods")
        .generate_csharp_file(&cli.output)
        .expect("Unable to generate C# bindings");

    let _ = std::fs::remove_file(temp_path);
}
