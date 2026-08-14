import os
import json
import pandas as pd
import sys
import re
import unicodedata

# Subimos 2 niveles desde backend/scripts para llegar a la raíz del proyecto
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(os.path.dirname(SCRIPT_DIR))

# Rutas exactas
OUTPUT_PATH_DISTRIBUIDORES = os.path.join(BASE_DIR, "backend", "repuestos_distribuidores.json")

def limpiar_valor(val):
    if pd.isna(val):
        return None
    val_str = str(val).strip()
    return val_str if val_str != "" else None

def normalize_header(name):
    if name is None:
        return ''
    # to string, lowercase
    s = str(name).strip().lower()
    # remove accents
    s = ''.join(c for c in unicodedata.normalize('NFKD', s) if not unicodedata.combining(c))
    # replace non-alphanumeric with underscore
    s = re.sub(r'[^0-9a-z]+', '_', s)
    # strip underscores
    s = s.strip('_')
    return s

def find_column(df_columns, possible_names):
    """Encuentra el primer nombre de columna que coincida de una lista de posibilidades.
    Compara usando nombres normalizados.
    Devuelve el nombre normalizado si se encuentra, o None."""
    normalized_map = {normalize_header(c): c for c in df_columns}
    # Exact normalized match first
    for name in possible_names:
        key = normalize_header(name)
        if key in normalized_map:
            return key
    # Fallback: substring match (e.g., 'codigoprincipal' contains 'codigo')
    for col_key in normalized_map.keys():
        for name in possible_names:
            key = normalize_header(name)
            if key and (key in col_key or col_key in key):
                return col_key
    return None

def procesar_hoja(xls, sheet_name):
    try:
        df = pd.read_excel(xls, sheet_name=sheet_name)
    except Exception as e:
        print(f"[WARN] No se pudo leer la hoja '{sheet_name}'. Error: {e}")
        return []

    # Normalize column names: remove accents, non-alphanumeric -> underscore, lowercase
    df.columns = [normalize_header(c) for c in df.columns]
    
    filas_procesadas = []

    # --- Detección flexible de nombres de columna ---
    possible_codigo_cols = ['codigo', 'cod', 'articulo', 'art', 'codigo_articulo', 'part_number', 'partnumber', 'sku']
    possible_descripcion_cols = ['descripcion', 'descrip', 'detalle', 'producto', 'nombre']
    possible_precio_cols = ['precio', 'precio_lista', 'precio_lista_', 'valor', 'importe', 'price', 'precio_venta', 'precio_unitario', 'lista']
    possible_marca_cols = ['marca', 'fabricante', 'brand', 'rubro']
    # Posibles nombres para código tercero/alternativo
    possible_codigo_tercero_cols = ['codigotercero', 'codigo_tercero', 'codigo_ter', 'codigoalterno', 'cod_tercero', 'codigo_alterno', 'codigo_3', 'codigo_2', 'codigoterc']

    codigo_col = find_column(df.columns, possible_codigo_cols)
    codigo_tercero_col = find_column(df.columns, possible_codigo_tercero_cols)
    descripcion_col = find_column(df.columns, possible_descripcion_cols)
    precio_col = find_column(df.columns, possible_precio_cols)
    marca_col = find_column(df.columns, possible_marca_cols)

    # Check if required columns exist
    if not codigo_col or not precio_col:
        print(f"[WARN] La hoja '{sheet_name}' no contiene las columnas requeridas ('codigo/articulo' y 'precio/lista') y será omitida.")
        print(f"     + Columnas disponibles: {list(df.columns)}")
        return []
    
    print(f"    [INFO] Columnas detectadas en '{sheet_name}': Código='{codigo_col}', Precio='{precio_col}', Descripción='{descripcion_col}', Marca='{marca_col}'")

    for idx, row in df.iterrows():
        codigo = limpiar_valor(row.get(codigo_col))
        precio_val = row.get(precio_col)

        # Skip rows without code or price
        if not codigo or pd.isna(precio_val):
            continue

        precio = None
        try:
            val_str = str(precio_val).replace("$", "").strip()
            if '.' in val_str and ',' in val_str:
                val_str = val_str.replace('.', '')
            val_str = val_str.replace(',', '.')
            precio_num = float(val_str)
            if precio_num > 0:
                precio = precio_num
        except (ValueError, TypeError):
            continue # Skip if price is not a valid number

        if precio is None:
            continue

        descripcion = limpiar_valor(row.get(descripcion_col, '')) if descripcion_col else ''
        marca = limpiar_valor(row.get(marca_col, '')) if marca_col else ''
        codigo_tercero = limpiar_valor(row.get(codigo_tercero_col)) if codigo_tercero_col else None

        # Construct the item with specific fields
        item = {
            "hoja_origen": sheet_name,
            "fila_origen": idx + 2,
            "codigo": codigo,
            "descripcion": descripcion,
            "marca": marca,
            "precio": precio,
            # include codigo_tercero under a stable key if present
            **({"codigo_tercero": codigo_tercero} if codigo_tercero else {}),
        }
        
        # Create 'datos_raw' for backward compatibility with search
        datos_raw = [val for val in [codigo, codigo_tercero, descripcion, marca] if val]
        item["datos_raw"] = datos_raw
        
        filas_procesadas.append(item)

    return filas_procesadas

def main():
    # Solo se espera un tipo de lista: distribuidores
    excel_path = os.path.join(BASE_DIR, "backend", "data", "lista.xlsx")
    output_path = OUTPUT_PATH_DISTRIBUIDORES
    list_type = "distribuidores" # Hardcodeamos el tipo de lista

    print(f"[INFO] Buscando archivo para lista de '{list_type}' en: {excel_path}")
    if not os.path.exists(excel_path):
        print(f"[ERROR] No se encontró el archivo Excel en la ruta esperada. Asegúrate de que el archivo se llame 'lista.xlsx'.")
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