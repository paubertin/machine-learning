const fs = require('fs');
const path = require('path');
const http = require('http');
const ts = require('typescript');

const DEBUG = false;

function log (...args) {
  if (DEBUG) {
    log(...args);
  }
}

function watch(directoryPath, options) {

  const configPath = ts.findConfigFile(
    /*searchPath*/ "./",
    ts.sys.fileExists,
    "tsconfig.json"
  );

  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  console.log('configPath', configPath);
  console.log('config', config.config);
  if (!configPath) {
    throw new Error("Could not find a valid 'tsconfig.json'.");
  }

  const files = {};

  const rootFileNames = [];

  // Récupère tous les fichiers .ts de manière récursive
  function collectFilesRecursively(dir) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        collectFilesRecursively(fullPath); // Si c'est un dossier, appelle la fonction récursivement
      } else if (stats.isFile() && item.endsWith('.ts')) {
        files[fullPath] = { version: 0 }; // Si c'est un fichier .ts, ajoute-le à la liste des fichiers à surveiller
        rootFileNames.push(fullPath);
      }
    });
  }

  collectFilesRecursively(directoryPath); // Appelle la fonction pour récupérer tous les fichiers .ts


  // Create the language service host to allow the LS to communicate with the host
  const servicesHost = {
    getCompilationSettings: () => config.config,
    getScriptFileNames: () => rootFileNames,
    getScriptVersion: fileName =>
      files[fileName] && files[fileName].version.toString(),
    getScriptSnapshot: fileName => {
      if (!fs.existsSync(fileName)) {
        return undefined;
      }

      return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
    },
    getCurrentDirectory: () => process.cwd(),
    getCompilationSettings: () => options,
    getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
  };

  // Create the language service files
  const services = ts.createLanguageService(servicesHost, ts.createDocumentRegistry());

  // Now let's watch the files
  rootFileNames.forEach(fileName => {
    // First time around, emit all files
    emitFile(fileName);

    // Add a watch on the file to handle next change
    fs.watchFile(fileName, { persistent: true, interval: 250 }, (curr, prev) => {
      // Check timestamp
      if (+curr.mtime <= +prev.mtime) {
        return;
      }

      // Update the version to signal a change in the file
      files[fileName].version++;

      // write the changes to disk
      emitFile(fileName);
    });
  });

  function emitFile(fileName) {
    let output = services.getEmitOutput(fileName);

    if (!output.emitSkipped) {
      log(`Emitting ${fileName}`);
    }
    else {
      log(`Emitting ${fileName} failed`);
      logErrors(fileName);
    }

    const outputDir = './build'; // Chemin vers le répertoire de sortie

    output.outputFiles.forEach(o => {
      const relativePath = path.relative(process.cwd(), o.name);
      const outputPath = path.join(outputDir, relativePath);
      const outputDirPath = path.dirname(outputPath);
      log('outputDirPath', outputDirPath);
    
      if (!fs.existsSync(outputDirPath)) {
        // fs.mkdirSync(outputDirPath, { recursive: true });
      }
    
      // fs.writeFileSync(outputPath, o.text, 'utf8');
    });

    output.outputFiles.forEach(o => {
      // fs.writeFileSync(o.name, o.text, "utf8");
    });
  }

  function logErrors(fileName) {
    let allDiagnostics = services
      .getCompilerOptionsDiagnostics()
      .concat(services.getSyntacticDiagnostics(fileName))
      .concat(services.getSemanticDiagnostics(fileName));

    allDiagnostics.forEach(diagnostic => {
      let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
      if (diagnostic.file) {
        let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
          diagnostic.start
        );
        log(`  Error ${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
      } else {
        log(`  Error: ${message}`);
      }
    });
  }
}
// Start the watcher
watch(path.join(__dirname, 'web'), { module: ts.ModuleKind.CommonJS });