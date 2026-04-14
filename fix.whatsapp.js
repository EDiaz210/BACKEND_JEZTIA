import fs from "fs";
import path from "path";

const filePath = path.resolve(
  "node_modules/whatsapp-web.js/src/util/Injected/Store.js"
);

try {
  // Siempre aplicar los fixes (no cached)
  if (!fs.existsSync(filePath)) {
    console.log("⚠ No se encontró Store.js");
    process.exit(0);
  }

  let content = fs.readFileSync(filePath, "utf8");
  const originalContent = content;
  let modified = false;

  // FIX 1: Deshabilitar LID Migration
  if (content.includes("Lid1X1MigrationUtils.isLidMigrated")) {
    content = content.replace(
      /Lid1X1MigrationUtils\.isLidMigrated/g,
      "false"
    );
    console.log("✔ FIX 1: LID Migration deshabilitado");
    modified = true;
  }

  // FIX 2: Proteger markedUnread con try-catch
  // Buscar la función que accede a markedUnread y envuelta en try-catch
  if (!content.includes("markedUnread /* PROTECTED */")) {
    // Reemplazar accesos directos a markedUnread con versión segura
    content = content.replace(
      /(\w+)\.markedUnread/g,
      "($1 && $1.markedUnread !== undefined ? $1.markedUnread /* PROTECTED */ : false)"
    );
    
    if (content !== originalContent) {
      console.log("✔ FIX 2: markedUnread protegido");
      modified = true;
    }
  }

  if (modified || content !== originalContent) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log("✔ Fixes aplicados");
  } else {
    console.log("ℹ Sin cambios necesarios");
  }
} catch (error) {
  console.error("⚠ Error:", error.message);
}
