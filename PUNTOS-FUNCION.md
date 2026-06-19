# Análisis de Puntos de Función — GQG System (Módulo de Crédito)

**Materia:** Ingeniería de Software III · Unidad 3 — *Mediciones y Técnicas de Estimación*
**Método:** Análisis de Puntos de Función (IFPUG, no ajustados → ajustados → esfuerzo).

> **Idea clave para la defensa:** los Puntos de Función miden el **tamaño funcional** del
> software (qué hace para el usuario), y son **independientes de la tecnología y de cómo se
> programó**. Usar IA **no cambia el tamaño en PF**; cambia la **productividad (horas/PF)** y,
> por lo tanto, el **esfuerzo y el cronograma**. Por eso el tamaño es uno solo y el esfuerzo
> se presenta en dos escenarios: tradicional y con asistencia de IA.

---

## 1. Pesos IFPUG (referencia)

| Componente | Baja | Media | Alta |
|---|---|---|---|
| ILF — Archivo Lógico Interno | 7 | 10 | 15 |
| EIF — Archivo de Interfaz Externo | 5 | 7 | 10 |
| EI — Entrada Externa | 3 | 4 | 6 |
| EO — Salida Externa | 4 | 5 | 7 |
| EQ — Consulta Externa | 3 | 4 | 6 |

---

## 2. ILF — Archivos Lógicos Internos (datos que el sistema mantiene)

| Archivo lógico | Tablas | Complejidad | PF |
|---|---|---|---|
| CLIENTES | CLIENTES | Baja | 7 |
| PRODUCTOS | PRODUCTOS + PRODUCTO_DETALLE | Media | 10 |
| PLAZOS | PLAZOS + PLAZO_DETALLES | Media | 10 |
| VENTAS | VENTAS + VENTA_DETALLES | Media | 10 |
| CUENTAS_COBRAR | CUENTAS_COBRAR | Baja | 7 |
| DEPOSITOS | DEPOSITOS | Baja | 7 |
| EMPRESAS | EMPRESAS | Baja | 7 |
| **Subtotal ILF** | | | **58** |

## 3. EIF — Archivos de Interfaz Externos (datos de referencia/código)

| Archivo | Complejidad | PF |
|---|---|---|
| MONEDAS (decimales por moneda — lo usa el trigger) | Baja | 5 |
| TIPOS_DOCUMENTO (Contado/Crédito) | Baja | 5 |
| **Subtotal EIF** | | **10** |

> *Algunas metodologías excluyen los datos de código; aquí se cuentan como EIF de baja
> complejidad. Excluirlos bajaría el total en 10 PF.*

## 4. EI — Entradas Externas (operaciones que mantienen datos)

| Entrada | Complejidad | PF |
|---|---|---|
| Registrar venta (dispara el trigger que genera las cuotas) | Media | 4 |
| Alta de plazo (cabecera + días de cada cuota) | Media | 4 |
| Alta de cliente | Baja | 3 |
| Modificación de cliente | Baja | 3 |
| Activar / desactivar cliente (baja lógica) | Baja | 3 |
| Alta de producto | Baja | 3 |
| Modificación de producto | Baja | 3 |
| Activar / desactivar producto | Baja | 3 |
| Alta / edición de depósito | Baja | 3 |
| Edición de empresa | Baja | 3 |
| Login (autenticación) | Baja | 3 |
| **Subtotal EI** | | **35** |

## 5. EO — Salidas Externas (salidas con datos derivados / cálculo)

| Salida | Complejidad | PF |
|---|---|---|
| Factura imprimible (liquidación de IVA + plan de cuotas) | Media | 5 |
| Vista previa de cuotas en la venta (cálculo en vivo + cuadre) | Media | 5 |
| **Subtotal EO** | | **10** |

## 6. EQ — Consultas Externas (recuperación sin cálculo)

| Consulta | Complejidad | PF |
|---|---|---|
| Listado de clientes | Baja | 3 |
| Listado de productos | Baja | 3 |
| Listado de plazos | Baja | 3 |
| Listado de ventas | Baja | 3 |
| Listado de depósitos | Baja | 3 |
| Consulta de empresa | Baja | 3 |
| Detalle de venta con sus cuentas a cobrar | Media | 4 |
| **Subtotal EQ** | | **22** |

---

## 7. Puntos de Función sin ajustar (PFSA / UFP)

| Componente | PF |
|---|---|
| ILF | 58 |
| EIF | 10 |
| EI | 35 |
| EO | 10 |
| EQ | 22 |
| **TOTAL PFSA** | **135** |

## 8. Factor de Ajuste (VAF) — 14 características generales (0–5)

| # | Característica | Valor |
|---|---|---|
| 1 | Comunicación de datos (web/online) | 4 |
| 2 | Procesamiento distribuido | 2 |
| 3 | Rendimiento | 3 |
| 4 | Configuración muy utilizada | 2 |
| 5 | Frecuencia de transacciones | 3 |
| 6 | Entrada de datos en línea | 5 |
| 7 | Eficiencia para el usuario final | 4 |
| 8 | Actualización en línea | 4 |
| 9 | Procesamiento complejo (cálculo de cuotas en el trigger) | 2 |
| 10 | Reusabilidad (CUENTAS_COBRAR polimórfica) | 3 |
| 11 | Facilidad de instalación (Docker, `setup.sh`) | 3 |
| 12 | Facilidad de operación | 3 |
| 13 | Múltiples sitios | 1 |
| 14 | Facilidad de cambio (plazos parametrizables) | 3 |
| | **Σ Grado de influencia (ΣGI)** | **42** |

```
CAF = 0,65 + (0,01 × ΣGI) = 0,65 + 0,42 = 1,07
PFA = PFSA × CAF = 135 × 1,07 ≈ 144 Puntos de Función ajustados
```

> **Tamaño funcional del sistema ≈ 144 PF.** Este número **no cambia** por usar IA: mide
> funcionalidad, no esfuerzo ni tecnología.

---

## 9. Estimación de esfuerzo — tradicional vs. con IA

El esfuerzo se obtiene dividiendo el tamaño por la **productividad** (horas-hombre por PF).
Ahí es donde **la programación asistida por IA sí influye**: acelera sobre todo la
**construcción/codificación**, no tanto análisis, diseño, pruebas y coordinación.

**Supuesto base (tradicional):** ≈ **10 h/PF** (valor típico de una app web de gestión con
equipo chico).

**Cómo entra la IA:** la codificación es ~55 % del esfuerzo total; la IA (Copilot, Claude
Code) reduce ese tramo entre 30 % y 55 % según estudios. La reducción **global** resulta más
moderada que la de una tarea aislada de código.

| Escenario | Reducción global | Productividad | Esfuerzo (144 PF) | Personas-mes¹ |
|---|---|---|---|---|
| **Tradicional** (sin IA) | — | 10,0 h/PF | **≈ 1.440 h** | ≈ 9,0 PM |
| **Con IA — conservador** | ~22 % | 7,8 h/PF | **≈ 1.123 h** | ≈ 7,0 PM |
| **Con IA — intensivo**² | ~40 % | 6,0 h/PF | **≈ 864 h** | ≈ 5,4 PM |

¹ 1 persona-mes = 160 h. &nbsp; ² Escenario coherente con **este** proyecto, construido con
asistencia intensiva de IA (generación de código, esquema, trigger y documentación).

```
Esfuerzo = PFA × (h/PF)
Tradicional : 144 × 10,0 = 1.440 h
Con IA      : 144 × 6,0  =   864 h   →  ahorro ≈ 40 % del esfuerzo de desarrollo
```

### Factor de productividad por IA (FP-IA)
```
FP-IA = horas_con_IA / horas_tradicional
Conservador : 1.123 / 1.440 ≈ 0,78  (–22 %)
Intensivo   :   864 / 1.440 ≈ 0,60  (–40 %)
```

---

## 10. Cómo defenderlo en una frase

- **Tamaño:** “El sistema tiene ≈ **144 PF ajustados** (135 sin ajustar); el núcleo son los
  archivos lógicos de PLAZOS, VENTAS y CUENTAS_COBRAR y las transacciones del ABM y la venta.”
- **IA y esfuerzo:** “Los PF miden **funcionalidad, no esfuerzo**: el tamaño es el mismo con o
  sin IA. Lo que cambia es la **productividad**. Programando con IA estimamos una reducción del
  esfuerzo de desarrollo de **~22 % a ~40 %** —de ~1.440 h a entre ~1.120 y ~860 h— porque la
  IA acelera principalmente la **construcción**, no el análisis, las pruebas ni la coordinación.”
