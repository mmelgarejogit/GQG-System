CREATE TABLE MONEDAS (
  id          INT NOT NULL,
  moneda      VARCHAR(50) NOT NULL,
  abreviatura VARCHAR(5)  NOT NULL,
  decimales   INT NOT NULL,
  activo      SMALLINT NOT NULL,
  CONSTRAINT pk_monedas PRIMARY KEY (id)
);
CREATE TABLE TIPOS_DOCUMENTO (
  id          INT NOT NULL,
  tipo        VARCHAR(200) NOT NULL,
  abreviatura VARCHAR(5)  NOT NULL,
  tipoid      INT NOT NULL,
  activo      SMALLINT NOT NULL,
  CONSTRAINT pktipodoc PRIMARY KEY (id)
);
CREATE TABLE EMPRESAS (
  id        INT NOT NULL,
  empresa   VARCHAR(200) NOT NULL,
  direccion VARCHAR(150),
  telefono  VARCHAR(15),
  mail      VARCHAR(50),
  ruc       VARCHAR(50) NOT NULL,
  monedaid  INT NOT NULL,
  timbrado       VARCHAR(20),
  timbrado_vence DATE,
  CONSTRAINT pk_empresa PRIMARY KEY (id),
  CONSTRAINT fkempmon FOREIGN KEY (monedaid) REFERENCES MONEDAS(id)
);
CREATE TABLE DEPOSITOS (
  id        INT NOT NULL,
  deposito  VARCHAR(200) NOT NULL,
  direccion VARCHAR(150),
  telefono  VARCHAR(15),
  activo    SMALLINT NOT NULL DEFAULT 1,
  CONSTRAINT pkdeposito PRIMARY KEY (id)
);
CREATE TABLE CLIENTES (
  id           INT NOT NULL,
  nombres      VARCHAR(200),
  apellidos    VARCHAR(200),
  documentonro VARCHAR(20),
  direccion    VARCHAR(200),
  email        VARCHAR(200),
  telefono     VARCHAR(200),
  activo       SMALLINT,
  CONSTRAINT pkcli PRIMARY KEY (id)
);
CREATE TABLE PLAZOS (
  id        INT NOT NULL,
  plazo     VARCHAR(100) NOT NULL,
  tipoid    INT NOT NULL,
  cuotas    INT NOT NULL,
  irregular SMALLINT NOT NULL,
  activo    SMALLINT NOT NULL DEFAULT 1,
  CONSTRAINT pkplazo PRIMARY KEY (id)
);
CREATE TABLE PLAZO_DETALLES (
  id      INT NOT NULL,
  plazoid INT NOT NULL,
  cuota   INT NOT NULL,
  dias    INT NOT NULL,
  CONSTRAINT pkplazodet PRIMARY KEY (id),
  CONSTRAINT fkplazodet FOREIGN KEY (plazoid) REFERENCES PLAZOS(id)
);
CREATE TABLE PRODUCTOS (
  id       INT NOT NULL,
  producto VARCHAR(200) NOT NULL,
  iva      DECIMAL(5,2) NOT NULL,
  servicio INT NOT NULL,
  precio   DECIMAL(18,5) NOT NULL DEFAULT 0,
  activo   SMALLINT NOT NULL DEFAULT 1,
  CONSTRAINT pkprod PRIMARY KEY (id)
);
CREATE TABLE PRODUCTO_DETALLE (
  codbarra   VARCHAR(50) NOT NULL,
  productoid INT NOT NULL,
  colorid    INT NOT NULL,
  tamanoid   INT NOT NULL,
  disenoid   INT NOT NULL,
  uxb        DECIMAL(18,5),
  CONSTRAINT pkprodet PRIMARY KEY (codbarra),
  CONSTRAINT fkprod FOREIGN KEY (productoid) REFERENCES PRODUCTOS(id)
);
CREATE TABLE VENTAS (
  id             INT NOT NULL,
  fechaproceso   DATETIME,
  fechafactura   DATETIME,
  clienteid      INT NOT NULL,
  serie          VARCHAR(10),
  nrofactura     INT NOT NULL,
  timbrado       VARCHAR(20),
  timbrado_vence DATE,
  totalexento    DECIMAL(18,5) NOT NULL,
  totalimpuesto  DECIMAL(18,5) NOT NULL,
  totalbase      DECIMAL(18,5) NOT NULL,
  totalfactura   DECIMAL(18,5) NOT NULL,
  depositoid     INT NOT NULL,
  monedaid       INT NOT NULL,
  tipodocid      INT NOT NULL,
  plazoid        INT NOT NULL,
  anulada         SMALLINT NOT NULL DEFAULT 0,
  anulada_fecha   DATETIME,
  anulada_usuario VARCHAR(50),
  anulada_motivo  VARCHAR(200),
  CONSTRAINT pkventa PRIMARY KEY (id),
  CONSTRAINT fkvtacli     FOREIGN KEY (clienteid)  REFERENCES CLIENTES(id),
  CONSTRAINT fkvtadpto    FOREIGN KEY (depositoid) REFERENCES DEPOSITOS(id),
  CONSTRAINT fkvtamoneda  FOREIGN KEY (monedaid)   REFERENCES MONEDAS(id),
  CONSTRAINT fkvtatipodoc FOREIGN KEY (tipodocid)  REFERENCES TIPOS_DOCUMENTO(id),
  CONSTRAINT fkvtaplazo   FOREIGN KEY (plazoid)    REFERENCES PLAZOS(id)
);
CREATE TABLE VENTA_DETALLES (
  ventaid    INT NOT NULL,
  codbarra   VARCHAR(50) NOT NULL,
  precio     DECIMAL(18,5) NOT NULL,
  cantidad   DECIMAL(18,5) NOT NULL,
  iva        DECIMAL(5,2)  NOT NULL,
  impuesto5  DECIMAL(18,5) NOT NULL,
  impuesto10 DECIMAL(18,5) NOT NULL,
  total      DECIMAL(18,5) NOT NULL,
  CONSTRAINT pkvtadet PRIMARY KEY (ventaid, codbarra),
  CONSTRAINT fkvtadetvta  FOREIGN KEY (ventaid)  REFERENCES VENTAS(id),
  CONSTRAINT fkvtadetprod FOREIGN KEY (codbarra) REFERENCES PRODUCTO_DETALLE(codbarra)
);
CREATE TABLE CUENTAS_COBRAR (
  id      INT NOT NULL AUTO_INCREMENT,
  tabla   VARCHAR(20) NOT NULL,
  tablaid INT NOT NULL,
  cuota   INT NOT NULL,
  importe DECIMAL(18,5) NOT NULL,
  cobrado DECIMAL(18,5) NOT NULL DEFAULT 0,
  vence   DATETIME NOT NULL,
  anulada SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT pkcc PRIMARY KEY (id)
);
CREATE TABLE AUDITORIA (
  id      INT NOT NULL AUTO_INCREMENT,
  fecha   DATETIME NOT NULL,
  usuario VARCHAR(50) NOT NULL,
  accion  VARCHAR(30) NOT NULL,
  tabla   VARCHAR(30) NOT NULL,
  tablaid INT NOT NULL,
  detalle VARCHAR(500),
  CONSTRAINT pkauditoria PRIMARY KEY (id)
);
