import os
import json
import pandas as pd

# Subimos 2 niveles desde backend/scripts para llegar a la raíz del proyecto
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(os.path.dirname(SCRIPT_DIR))

# Rutas exactas
EXCEL_PATH = os.path.join(BASE_DIR, "data", "DL 13-08-2026.XLSX")
OUTPUT_PATH = os.path.join(BASE_DIR, "backend", "repuestos_unificados.json")

def limpiar_valor(val):
    if pd.isna(val):
        return None
    val_str = str(val).strip()
    return val_str if val_str != "" else None

def procesar_hoja(xls, sheet_name):
    df = pd.read_excel(xls, sheet_name=sheet_name)
    filas_procesadas = []

    for idx, row in df.iterrows():
        valores = [limpiar_valor(v) for v in row.values]
        valores_validos = [v for v in valores if v is not None]

        if not valores_validos:
            continue

        texto_fila = " ".join(valores_validos).upper()
        if "INDICE" in texto_fila or "LISTA DE PRECIOS" in texto_fila:
            continue

        precios = []
        for val in valores_validos:
            try:
                val_num = float(str(val).replace(",", "."))
                if val_num > 0:
                    precios.append(val_num)
            except ValueError:
                pass

        if precios and len(valores_validos) >= 2:
            item = {
                "hoja_origen": sheet_name,
                "fila_origen": idx + 2, # +2 porque pandas es 0-indexed y la fila 1 es el header
                "datos_raw": valores_validos,
                "precio": precios[-1]
            }
            filas_procesadas.append(item)

    return filas_procesadas

def main():
    print(f"🔍 Buscando archivo en: {EXCEL_PATH}")
    if not os.path.exists(EXCEL_PATH):
        print(f"❌ Error: No se encontró el Excel en esa ruta.")
        print("Verificá que el archivo se llame exactamente 'DL 13-08-2026.XLSX' y esté dentro de la carpeta 'data'.")
        return

    print("📖 Leyendo Excel y procesando hojas...")
    xls = pd.ExcelFile(EXCEL_PATH)
    total_repuestos = []
    
    for sheet in xls.sheet_names:
        if sheet.strip().upper() == "INDICE":
            continue
        
        repuestos_hoja = procesar_hoja(xls, sheet)
        total_repuestos.extend(repuestos_hoja)
        print(f"  ✔️ [{sheet}]: {len(repuestos_hoja)} repuestos extraídos.")

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(total_repuestos, f, ensure_ascii=False, indent=2)

    print("\n" + "="*50)
    print(f"🎉 ¡Proceso finalizado con éxito!")
    print(f"📦 Total de artículos: {len(total_repuestos)}")
    print(f"💾 Guardado en: {OUTPUT_PATH}")
    print("="*50)

if __name__ == "__main__":
    main()