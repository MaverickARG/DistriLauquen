import os
import json
import pandas as pd
import sys

# Subimos 2 niveles desde backend/scripts para llegar a la raíz del proyecto
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(os.path.dirname(SCRIPT_DIR))

# Rutas exactas
OUTPUT_PATH_MECANICOS = os.path.join(BASE_DIR, "backend", "repuestos_mecanicos.json")
OUTPUT_PATH_FINALES = os.path.join(BASE_DIR, "backend", "repuestos_finales.json")

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
                val_str = str(val).replace("$", "").strip()
                
                # Si hay puntos y comas, asumimos que el punto es de miles (formato AR)
                if '.' in val_str and ',' in val_str:
                    val_str = val_str.replace('.', '')
                
                # La coma siempre se trata como separador decimal
                val_str = val_str.replace(',', '.')
                
                val_num = float(val_str)
                if val_num > 0:
                    precios.append(val_num)
            except (ValueError, TypeError):
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
    if len(sys.argv) < 2 or sys.argv[1] not in ['mecanicos', 'finales']:
        print("[ERROR] Tipo de lista inválido. Debe ser 'mecanicos' o 'finales'.")
        sys.exit(1)

    list_type = sys.argv[1]
    
    if list_type == 'mecanicos':
        excel_path = os.path.join(BASE_DIR, "data", "distribuidor.xlsx")
        output_path = OUTPUT_PATH_MECANICOS
    else: # finales
        excel_path = os.path.join(BASE_DIR, "data", "final.xlsx")
        output_path = OUTPUT_PATH_FINALES

    print(f"[INFO] Buscando archivo para lista '{list_type}' en: {excel_path}")
    if not os.path.exists(excel_path):
        filename = 'distribuidor.xlsx' if list_type == 'mecanicos' else 'final.xlsx'
        print(f"[ERROR] No se encontró el archivo Excel en la ruta esperada. Asegúrate de que el archivo se llame '{filename}'.")
        sys.exit(1)

    print("[INFO] Leyendo Excel y procesando hojas...")
    xls = pd.ExcelFile(excel_path)
    total_repuestos = []
    
    for sheet in xls.sheet_names:
        sheet_upper = sheet.strip().upper()
        if sheet_upper == "INDICE":
            continue
        
        print(f"  -> Procesando hoja: '{sheet}'...")
        repuestos_hoja = procesar_hoja(xls, sheet)
        total_repuestos.extend(repuestos_hoja)
        print(f"     + {len(repuestos_hoja)} artículos extraídos.")

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(total_repuestos, f, ensure_ascii=False, indent=2)

    print("\n" + "="*50)
    print(f"[SUCCESS] ¡Proceso para lista '{list_type}' finalizado con éxito!")
    print(f"  - Total de artículos procesados: {len(total_repuestos)}")
    print(f"  - Guardado en: {output_path}")
    print("="*50)

if __name__ == "__main__":
    main()