-- ============================================================================
-- GQG System - Trigger de generacion de cuotas (Opcion A: sin interes)
-- AL INSERTAR una VENTA genera las filas de CUENTAS_COBRAR.
--   - Contado  -> 1 cuota, vence = fecha factura
--   - Regular  -> i*30 dias
--   - Irregular-> dias de PLAZO_DETALLES
--   - La ultima cuota absorbe el redondeo (suma de cuotas = total exacto)
-- ============================================================================

DROP TRIGGER IF EXISTS ins_ventas;

DELIMITER //

CREATE TRIGGER ins_ventas AFTER INSERT ON VENTAS
FOR EACH ROW
BEGIN
  DECLARE nCuotas        INT DEFAULT 0;
  DECLARE isIrregular    SMALLINT DEFAULT 0;
  DECLARE decimalesMon   INT DEFAULT 0;
  DECLARE importecuota   DECIMAL(18,5) DEFAULT 0;
  DECLARE ultimacuota    DECIMAL(18,5) DEFAULT 0;
  DECLARE acredito       INT DEFAULT 0;          -- 0=Contado, 1=Credito
  DECLARE doctipoid      INT DEFAULT -1;
  DECLARE plazotipoid    INT DEFAULT -1;
  DECLARE i              INT DEFAULT 1;
  DECLARE dias           INT DEFAULT 0;
  DECLARE imp            DECIMAL(18,5) DEFAULT 0;

  -- 1) El tipo del documento y el tipo del plazo deben coincidir
  SELECT IFNULL(td.tipoid, -1) INTO doctipoid
    FROM TIPOS_DOCUMENTO td WHERE td.id = NEW.tipodocid;
  SELECT IFNULL(p.tipoid, -1) INTO plazotipoid
    FROM PLAZOS p WHERE p.id = NEW.plazoid;

  IF (doctipoid < 0 OR plazotipoid < 0) OR (doctipoid <> plazotipoid) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tipo de documentos y plazos no coinciden.';
  END IF;
  SET acredito = doctipoid;

  -- 2) Cantidad de cuotas y modalidad (regular/irregular)
  SELECT IFNULL(p.cuotas, 0), IFNULL(p.irregular, 0)
    INTO nCuotas, isIrregular
    FROM PLAZOS p WHERE p.id = NEW.plazoid;

  IF nCuotas = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ingrese cantidad de cuotas.';
  END IF;

  -- decimales de la moneda (Guarani = 0)
  SELECT IFNULL(m.decimales, 0) INTO decimalesMon
    FROM MONEDAS m WHERE m.id = NEW.monedaid;

  -- 3) Importe base de cada cuota (trunca a los decimales de la moneda)
  SET importecuota = TRUNCATE(NEW.totalfactura / nCuotas, decimalesMon);
  IF importecuota = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El importe de cuotas no puede ser cero.';
  END IF;

  -- 4) Ultima cuota: absorbe la diferencia de redondeo
  SET ultimacuota = NEW.totalfactura - importecuota * (nCuotas - 1);

  -- 5) Generar las cuentas a cobrar
  IF acredito = 0 THEN
    -- Contado: una sola cuota, vence en la fecha de la factura
    INSERT INTO CUENTAS_COBRAR (tabla, tablaid, cuota, importe, cobrado, vence)
      VALUES ('VENTAS', NEW.id, 1, NEW.totalfactura, 0, NEW.fechafactura);
  ELSE
    SET i = 1;
    WHILE i <= nCuotas DO
      -- dias de vencimiento de esta cuota
      IF isIrregular = 1 THEN
        SET dias = i * 30;
        SELECT pd.dias INTO dias
          FROM PLAZO_DETALLES pd
          WHERE pd.plazoid = NEW.plazoid AND pd.cuota = i;
      ELSE
        SET dias = i * 30;
      END IF;

      -- importe: las primeras N-1 son la base, la ultima absorbe el redondeo
      IF i < nCuotas THEN
        SET imp = importecuota;
      ELSE
        SET imp = ultimacuota;
      END IF;

      INSERT INTO CUENTAS_COBRAR (tabla, tablaid, cuota, importe, cobrado, vence)
        VALUES ('VENTAS', NEW.id, i, imp, 0,
                DATE_ADD(NEW.fechafactura, INTERVAL dias DAY));

      SET i = i + 1;
    END WHILE;
  END IF;
END //

DELIMITER ;
