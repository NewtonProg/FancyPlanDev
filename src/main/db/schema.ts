export const SCHEMA_VERSION = 1

export const SCHEMA_SQL = `

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS db_meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- ── Reference tables ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS TArea (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  IDArea        INTEGER,
  AreaName      TEXT NOT NULL,
  Prio1def      INTEGER,
  Prio2def      INTEGER,
  Prio3def      INTEGER,
  seq1          INTEGER,
  binArchiv     INTEGER DEFAULT 0,
  AreaCreated   TEXT,
  ActViewLast   INTEGER,
  strTempArchiv TEXT,
  strTemp       TEXT,
  intTemp       INTEGER,
  IDTAreaUserExit TEXT,
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tarea_name ON TArea(AreaName);

CREATE TABLE IF NOT EXISTS TTheme (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  IDTheme       INTEGER,
  ThemeName     TEXT NOT NULL,
  seq1          INTEGER,
  binArchiv     INTEGER DEFAULT 0,
  ActViewLast   INTEGER,
  strTempArchiv TEXT,
  strTemp       TEXT,
  intTemp       INTEGER,
  visCbo1 INTEGER, visCbo2 INTEGER, visCbo3 INTEGER, visCbo4 INTEGER, visCbo5 INTEGER,
  lblCbo1 TEXT,    lblCbo2 TEXT,    lblCbo3 TEXT,    lblCbo4 TEXT,    lblCbo5 TEXT,
  Cbo1TxtColmNr INTEGER, Cbo2TxtColmNr INTEGER, Cbo3TxtColmNr INTEGER,
  Cbo4TxtColmNr INTEGER, Cbo5TxtColmNr INTEGER,
  BoundColumn1 INTEGER, BoundColumn2 INTEGER, BoundColumn3 INTEGER,
  BoundColumn4 INTEGER, BoundColumn5 INTEGER,
  ColumnCount1 INTEGER, ColumnCount2 INTEGER, ColumnCount3 INTEGER,
  ColumnCount4 INTEGER, ColumnCount5 INTEGER,
  ColumnWidths1 TEXT, ColumnWidths2 TEXT, ColumnWidths3 TEXT,
  ColumnWidths4 TEXT, ColumnWidths5 TEXT,
  RowSource1 TEXT, RowSource2 TEXT, RowSource3 TEXT,
  RowSource4 TEXT, RowSource5 TEXT,
  IDFormName    TEXT DEFAULT '*',
  IDArea        INTEGER DEFAULT 0,
  ThemeCreated  TEXT,
  UserExit      TEXT,
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ttheme_name ON TTheme(ThemeName);

CREATE TABLE IF NOT EXISTS TCat (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  IDCat         INTEGER,
  IDFormName    TEXT,
  bActive       INTEGER DEFAULT 1,
  Cat           TEXT,
  CatGrp        TEXT,
  strUserExit TEXT, strUserExitPar1 TEXT, strUserExitPar2 TEXT,
  strUserExitPar3 TEXT, strUserExitPar4 TEXT,
  UserExit      TEXT,
  visCbo1 INTEGER, visCbo2 INTEGER, visCbo3 INTEGER, visCbo4 INTEGER, visCbo5 INTEGER,
  lblCbo1 TEXT,    lblCbo2 TEXT,    lblCbo3 TEXT,    lblCbo4 TEXT,    lblCbo5 TEXT,
  Cbo1TxtColmNr INTEGER, Cbo2TxtColmNr INTEGER, Cbo3TxtColmNr INTEGER,
  Cbo4TxtColmNr INTEGER, Cbo5TxtColmNr INTEGER,
  BoundColumn1 INTEGER, BoundColumn2 INTEGER, BoundColumn3 INTEGER,
  BoundColumn4 INTEGER, BoundColumn5 INTEGER,
  ColumnCount1 INTEGER, ColumnCount2 INTEGER, ColumnCount3 INTEGER,
  ColumnCount4 INTEGER, ColumnCount5 INTEGER,
  ColumnWidths1 TEXT, ColumnWidths2 TEXT, ColumnWidths3 TEXT,
  ColumnWidths4 TEXT, ColumnWidths5 TEXT,
  RowSource1 TEXT, RowSource2 TEXT, RowSource3 TEXT,
  RowSource4 TEXT, RowSource5 TEXT,
  CatCreated    TEXT,
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS TPrio1 (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  IDPrio1     INTEGER,
  IDFormName  TEXT NOT NULL,
  IDProfile   TEXT DEFAULT '*',
  Action      TEXT,
  Prio1       INTEGER,
  Prio1Txt    TEXT
);

CREATE TABLE IF NOT EXISTS TPrio2 (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  IDPrio2     INTEGER,
  IDFormName  TEXT NOT NULL,
  IDProfile   TEXT DEFAULT '*',
  Action      TEXT,
  Prio2       INTEGER,
  Prio2Txt    TEXT
);

CREATE TABLE IF NOT EXISTS TPrio3 (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  IDPrio3     INTEGER,
  IDFormName  TEXT NOT NULL,
  IDProfile   TEXT DEFAULT '*',
  Action      TEXT,
  Prio3       INTEGER,
  Prio3Txt    TEXT
);

CREATE TABLE IF NOT EXISTS TGroup1 (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  IDGrp1        INTEGER,
  IDFormName    TEXT NOT NULL,
  Group1        TEXT,
  date1         TEXT,
  digit1        REAL,
  HL1           TEXT,
  txt1          TEXT,
  UserExitPar1  TEXT,
  UserExitPar2  TEXT,
  UserExitPar3  TEXT,
  UserExitPar4  TEXT,
  UserExit      TEXT
);

-- ── Core business tables ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS TAct (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  IDAct               INTEGER,
  IDHyp               INTEGER,
  IDIFList            INTEGER,
  IDT                 TEXT,
  key                 TEXT,
  IDTn                TEXT,
  IDeHtml             INTEGER,
  Title               TEXT NOT NULL,
  ActBeg              TEXT,
  ActEnd              TEXT,
  ActView             INTEGER,
  AreaName            TEXT NOT NULL,
  blnTmp              TEXT,
  bMark               INTEGER DEFAULT 0,
  Cat                 TEXT,
  CatEMail            TEXT,
  CatTel              TEXT,
  CatWL               TEXT,
  clickDate           TEXT,
  Com                 TEXT,
  comInfo1            TEXT,
  comInfo1Txt         TEXT,
  comInfo2            TEXT,
  comInfo2Txt         TEXT,
  CostCtrNr           TEXT,
  CostCtrName         TEXT,
  dateCreated         TEXT,
  dateEnd             TEXT,
  dateFin             TEXT,
  dateSrch            TEXT,
  dateTarget          TEXT,
  dateTmp1            TEXT,
  dateTmp2            TEXT,
  EMailAdrSender      TEXT,
  EMailNameSender     TEXT,
  EMailAdrReceiver    TEXT,
  EMailNameReceiver   TEXT,
  extFct              TEXT,
  Fct2                TEXT,
  FeedBackMsg         TEXT,
  frm                 TEXT,
  iCalID              INTEGER,
  IDActLink           INTEGER,
  IDSQL               TEXT,
  IFName              TEXT,
  IFType              INTEGER,
  imgPath1            TEXT,
  imgPath2            TEXT,
  lngTmp              INTEGER,
  Ltxt1               TEXT,
  Ltxt2               TEXT,
  Num1                INTEGER,
  Num2                INTEGER,
  OrderNr             TEXT,
  OrderName           TEXT,
  ProjektName         TEXT,
  Pl1Beg              TEXT,
  Pl1End              TEXT,
  Pl1Dur              TEXT,
  Pl1sngDur           REAL,
  Pl2Beg              TEXT,
  Pl2End              TEXT,
  PlCostKum           REAL,
  Points              INTEGER,
  Prio1               INTEGER,
  Prio2               INTEGER,
  Prio3               INTEGER,
  PSPName             TEXT,
  PSPNumber           TEXT,
  QueryType           TEXT,
  Sblank              INTEGER DEFAULT 0,
  SbirthDay           INTEGER DEFAULT 0,
  Sday                INTEGER DEFAULT 0,
  Sdel                INTEGER DEFAULT 0,
  Sdone               INTEGER DEFAULT 0,
  SDetailStat         INTEGER DEFAULT 0,
  Sdisplay            INTEGER DEFAULT 0,
  SHL                 INTEGER DEFAULT 0,
  SInfo               INTEGER,
  SinWork             INTEGER DEFAULT 0,
  SmyAct              INTEGER DEFAULT 0,
  Status              TEXT NOT NULL,
  StatusGrp           TEXT,
  SsendEmail          INTEGER DEFAULT 0,
  SToday              INTEGER DEFAULT 0,
  str1                TEXT,
  strSQL              TEXT,
  strTmp              TEXT,
  Susr01 INTEGER DEFAULT 0, Susr02 INTEGER DEFAULT 0, Susr03 INTEGER DEFAULT 0,
  Susr04 INTEGER DEFAULT 0, Susr05 INTEGER DEFAULT 0, Susr06 INTEGER DEFAULT 0,
  Susr07 INTEGER DEFAULT 0, Susr08 INTEGER DEFAULT 0, Susr09 INTEGER DEFAULT 0,
  Susr10 INTEGER DEFAULT 0,
  SvisTree            INTEGER DEFAULT 0,
  TelNr               TEXT,
  ThemeName           TEXT NOT NULL,
  TodayEdited         TEXT,
  TodayDone           TEXT,
  ToDayShifted        TEXT,
  Timer1BegFirst TEXT, Timer1BegToday TEXT, Timer1Beg TEXT, Timer1End TEXT,
  Timer1EndToday TEXT, Timer1sngDur REAL, Timer1Dur TEXT,
  Timer1sngDurToday REAL, Timer1DurToday TEXT, Timer1Active INTEGER DEFAULT 0,
  Timer1Stamp TEXT,
  Timer2BegFirst TEXT, Timer2BegToday TEXT, Timer2Beg TEXT, Timer2End TEXT,
  Timer2EndToday TEXT, Timer2sngDur REAL, Timer2Dur TEXT,
  Timer2sngDurToday REAL, Timer2DurToday TEXT, Timer2Active INTEGER DEFAULT 0,
  Timer2Stamp TEXT,
  Timer3BegFirst TEXT, Timer3BegToday TEXT, Timer3Beg TEXT, Timer3End TEXT,
  Timer3EndToday TEXT, Timer3sngDur REAL, Timer3Dur TEXT,
  Timer3sngDurToday REAL, Timer3DurToday TEXT, Timer3Active INTEGER DEFAULT 0,
  Timer3Stamp TEXT,
  Timer4BegFirst TEXT, Timer4BegToday TEXT, Timer4Beg TEXT, Timer4End TEXT,
  Timer4EndToday TEXT, Timer4sngDur REAL, Timer4Dur TEXT,
  Timer4sngDurToday REAL, Timer4DurToday TEXT, Timer4Active INTEGER DEFAULT 0,
  Timer4Stamp TEXT,
  TitleLink           TEXT,
  TreeNr              TEXT,
  TreeType            TEXT,
  TreeTitle           TEXT,
  UniqueID            INTEGER,
  UsrCbo1 TEXT, UsrCbo2 TEXT, UsrCbo3 TEXT, UsrCbo4 TEXT, UsrCbo5 TEXT,
  UsrCboTxt1 TEXT, UsrCboTxt2 TEXT, UsrCboTxt3 TEXT, UsrCboTxt4 TEXT, UsrCboTxt5 TEXT,
  UserExit            TEXT,
  valCurr             REAL,
  valCurrTxt          TEXT,
  xl1 TEXT, xl2 TEXT, xl3 TEXT, xl4 TEXT,
  xl5 TEXT, xl6 TEXT, xl7 TEXT, xl8 TEXT,
  created_at          TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at          TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tact_area     ON TAct(AreaName);
CREATE INDEX IF NOT EXISTS idx_tact_theme    ON TAct(ThemeName);
CREATE INDEX IF NOT EXISTS idx_tact_status   ON TAct(Status);
CREATE INDEX IF NOT EXISTS idx_tact_actbeg   ON TAct(ActBeg);
CREATE INDEX IF NOT EXISTS idx_tact_sdone    ON TAct(Sdone);
CREATE INDEX IF NOT EXISTS idx_tact_stoday   ON TAct(SToday);
CREATE INDEX IF NOT EXISTS idx_tact_sdel     ON TAct(Sdel);

CREATE TABLE IF NOT EXISTS TTel (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  IDTel           INTEGER,
  SurName         TEXT,
  TelNr1          TEXT,
  EMail1          TEXT,
  Adress1         TEXT,
  Adress2         TEXT,
  BegLet          TEXT,
  bln1            INTEGER DEFAULT 0,
  bIsImap1        INTEGER DEFAULT 0,
  bIsImap2        INTEGER DEFAULT 0,
  bIsImap3        INTEGER DEFAULT 0,
  bMark           INTEGER DEFAULT 0,
  bMailFavo1      INTEGER DEFAULT 0,
  bMailFavo2      INTEGER DEFAULT 0,
  bMailFavo3      INTEGER DEFAULT 0,
  bSender1        INTEGER DEFAULT 0,
  bSender2        INTEGER DEFAULT 0,
  bSender3        INTEGER DEFAULT 0,
  bProviderReg1   INTEGER DEFAULT 0,
  bProviderReg2   INTEGER DEFAULT 0,
  bProviderReg3   INTEGER DEFAULT 0,
  Cat             TEXT,
  Company         TEXT,
  Country         TEXT,
  ConversationTopic TEXT,
  Com             TEXT,
  dataType        TEXT,
  Departm         TEXT,
  EMail1Com       TEXT,
  EMAil1Pwd       TEXT,
  EMail2          TEXT,
  EMail2Com       TEXT,
  EMail2Pwd       TEXT,
  EMail3          TEXT,
  EMail3Com       TEXT,
  EMail3Pwd       TEXT,
  EntryIDTask     TEXT,
  Fax             TEXT,
  FaxCom          TEXT,
  FirstName       TEXT,
  fpToken1        TEXT,
  fpToken2        TEXT,
  fpToken3        TEXT,
  Grp1            TEXT,
  Grp2            TEXT,
  Grp3            TEXT,
  HeadOffice      TEXT,
  Hobby           TEXT,
  IDActLink       INTEGER,
  imgPath1        TEXT,
  Importance      INTEGER,
  InfoSource1     TEXT,
  InfoSource2     TEXT,
  InfoSource3     TEXT,
  JobTitle        TEXT,
  Language        TEXT,
  ManagerName     TEXT,
  MailProvider1   TEXT,
  MailProvider2   TEXT,
  MailProvider3   TEXT,
  Mobile1         TEXT,
  Mobile1Com      TEXT,
  Mobile2         TEXT,
  Mobile2Com      TEXT,
  MrMrs           TEXT,
  NamePSP         TEXT,
  Prio1           INTEGER,
  Prio2           INTEGER,
  RateMin         REAL,
  RateMax         REAL,
  Region          TEXT,
  SactPrv         INTEGER DEFAULT 0,
  SactBus         INTEGER DEFAULT 0,
  SurNameCom      TEXT,
  Status          TEXT,
  TelNr1Com       TEXT,
  TelNr2          TEXT,
  TelNr2Com       TEXT,
  TelNr3          TEXT,
  TelNr3Com       TEXT,
  Title           TEXT,
  Theme           TEXT,
  TitleLink       TEXT,
  TMrMrs          TEXT,
  txt1            TEXT,
  txt2            TEXT,
  txt3            TEXT,
  UniqueID        INTEGER,
  User1           TEXT,
  User2           TEXT,
  User3           TEXT,
  User4           TEXT,
  www1            TEXT,
  www1Com         TEXT,
  www2            TEXT,
  www2Com         TEXT,
  www3            TEXT,
  www3Com         TEXT,
  USerExit        TEXT,
  created_at      TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ttel_surname ON TTel(SurName);
CREATE INDEX IF NOT EXISTS idx_ttel_company ON TTel(Company);
CREATE INDEX IF NOT EXISTS idx_ttel_email1  ON TTel(EMail1);

-- ── TTelEmail — E-Mail-Adressen (1:n) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS TTelEmail (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  tel_id       INTEGER NOT NULL,
  EMail        TEXT NOT NULL DEFAULT '',
  bSender      INTEGER DEFAULT 0,
  bFavorit     INTEGER DEFAULT 0,
  bIsImap      INTEGER DEFAULT 0,
  Com          TEXT,
  Pwd          TEXT,
  MailProvider TEXT,
  sort_order   INTEGER DEFAULT 0,
  created_at   TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ttelemail_tel ON TTelEmail(tel_id);

-- ── TTelWeb — Web-Adressen (1:n) ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS TTelWeb (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  tel_id       INTEGER NOT NULL,
  Url          TEXT NOT NULL DEFAULT '',
  Com          TEXT,
  sort_order   INTEGER DEFAULT 0,
  created_at   TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ttelweb_tel ON TTelWeb(tel_id);

-- ── TTree — Baumstruktur ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS TTree (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  IDParent   INTEGER,
  name       TEXT NOT NULL,
  level      INTEGER DEFAULT 0,
  seq        INTEGER DEFAULT 0,
  path       TEXT DEFAULT '',
  IDTreeRef  INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ttree_parent ON TTree(IDParent);
CREATE INDEX IF NOT EXISTS idx_ttree_path   ON TTree(path);

-- ── Planvarianten ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS TPlanVariant (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS TPlanVariantItem (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  IDPlanVariant INTEGER NOT NULL,
  IDTAct        INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tpvi_variant ON TPlanVariantItem(IDPlanVariant);

-- ── TAct_Log — Detail-Protokoll ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS TAct_Log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  IDTAct      INTEGER NOT NULL,
  changed_at  TEXT DEFAULT CURRENT_TIMESTAMP,
  field_name  TEXT NOT NULL,
  old_value   TEXT,
  new_value   TEXT
);
CREATE INDEX IF NOT EXISTS idx_tactlog_idtact ON TAct_Log(IDTAct);

-- ── TLinks — generische Links (Kontakte + Baumknoten) ─────────────────────

CREATE TABLE IF NOT EXISTS TLinks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id   INTEGER NOT NULL,
  link_type   TEXT NOT NULL DEFAULT 'web',
  url         TEXT NOT NULL,
  label       TEXT,
  password    TEXT,
  seq         INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tlinks_entity ON TLinks(entity_type, entity_id);

-- ── TAreaTheme — Bereich-Thema Zuordnung ────────────────────────────────────

CREATE TABLE IF NOT EXISTS TAreaTheme (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  IDArea   INTEGER NOT NULL,
  IDTheme  INTEGER NOT NULL,
  UNIQUE(IDArea, IDTheme)
);
CREATE INDEX IF NOT EXISTS idx_tareatheme_area  ON TAreaTheme(IDArea);
CREATE INDEX IF NOT EXISTS idx_tareatheme_theme ON TAreaTheme(IDTheme);

-- ── TStatus — Status-Werte pro Formular/Thema ────────────────────────────────

CREATE TABLE IF NOT EXISTS TStatus (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  IDFormName TEXT NOT NULL DEFAULT '*',
  IDTheme    INTEGER DEFAULT 0,
  Status     TEXT NOT NULL,
  StatusGrp  TEXT,
  seq        INTEGER DEFAULT 0,
  binArchiv  INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tstatus_form ON TStatus(IDFormName);

-- ── TLand — Länderliste ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS TLand (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  LandName TEXT NOT NULL,
  LandCode TEXT,
  seq      INTEGER DEFAULT 0
);

-- ── TGroupValues — Werte für Gruppen 1-8 ────────────────────────────────────

CREATE TABLE IF NOT EXISTS TGroupValues (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  group_nr    INTEGER NOT NULL,
  IDFormName  TEXT NOT NULL DEFAULT '*',
  grp_value   TEXT NOT NULL,
  seq         INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_tgroupval_nr ON TGroupValues(group_nr, IDFormName);

-- ── TFCMStatus — Status mit Automatik-Aktionen ───────────────────────────────

CREATE TABLE IF NOT EXISTS TFCMStatus (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  Status      TEXT NOT NULL,
  StatusGrp   TEXT DEFAULT 'All',
  Aktion      TEXT,
  Points      INTEGER DEFAULT 0,
  relevant    INTEGER DEFAULT 1,
  Kategorie   TEXT,
  UserExit    TEXT,
  SortNr      INTEGER DEFAULT 0,
  katFind     TEXT,
  katReplace  TEXT,
  p1LtVal     INTEGER, p1LtSet INTEGER, p1LtNoop INTEGER DEFAULT 1,
  p1EqVal     INTEGER, p1EqSet INTEGER, p1EqNoop INTEGER DEFAULT 1,
  p1GtVal     INTEGER, p1GtSet INTEGER, p1GtNoop INTEGER DEFAULT 1,
  p2LtVal     INTEGER, p2LtSet INTEGER, p2LtNoop INTEGER DEFAULT 1,
  p2EqVal     INTEGER, p2EqSet INTEGER, p2EqNoop INTEGER DEFAULT 1,
  p2GtVal     INTEGER, p2GtSet INTEGER, p2GtNoop INTEGER DEFAULT 1,
  p3LtVal     INTEGER, p3LtSet INTEGER, p3LtNoop INTEGER DEFAULT 1,
  p3EqVal     INTEGER, p3EqSet INTEGER, p3EqNoop INTEGER DEFAULT 1,
  p3GtVal     INTEGER, p3GtSet INTEGER, p3GtNoop INTEGER DEFAULT 1,
  setIstVon    INTEGER DEFAULT 0,
  setIstBis    INTEGER DEFAULT 0,
  setPlanVon   INTEGER DEFAULT 0,
  setPlanBis   INTEGER DEFAULT 0,
  setInfo      INTEGER DEFAULT 0,
  setLtxt1Date INTEGER DEFAULT 0,
  setLtxt2Date INTEGER DEFAULT 0,
  setErledigt  INTEGER DEFAULT 0,
  text1        TEXT,
  text2        TEXT,
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tfcmstatus_status ON TFCMStatus(Status);

-- ── Kontierungsobjekte (Expert-Feature für Abrechnung / Stundenmeldung) ──────

CREATE TABLE IF NOT EXISTS TKostenstelle (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  KSName   TEXT NOT NULL,
  KSNr     TEXT,
  seq      INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS TAuftrag (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  AuftragName TEXT NOT NULL,
  AuftragNr   TEXT,
  seq         INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS TProjekt (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ProjektName TEXT NOT NULL,
  ProjektNr   TEXT,
  seq         INTEGER DEFAULT 0
);

-- ── TSettings — Schlüssel/Wert-Speicher ───────────────────────────────────

CREATE TABLE IF NOT EXISTS TSettings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- ── TMailReceive — lokaler Mail-Cache ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS TMailReceive (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  msg_uid         TEXT UNIQUE NOT NULL,
  thread_id       TEXT,
  subject         TEXT,
  from_addr       TEXT,
  from_name       TEXT,
  to_addr         TEXT,
  date_received   TEXT,
  snippet         TEXT,
  body_html       TEXT,
  body_text       TEXT,
  is_read         INTEGER DEFAULT 0,
  has_attachment  INTEGER DEFAULT 0,
  synced_at       TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tmailrecv_date ON TMailReceive(date_received);
CREATE INDEX IF NOT EXISTS idx_tmailrecv_read ON TMailReceive(is_read);

-- ── TMailAttachment — Mail-Anhänge (BLOB gespeichert) ────────────────────

CREATE TABLE IF NOT EXISTS TMailAttachment (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  mail_id      INTEGER NOT NULL REFERENCES TMailReceive(id) ON DELETE CASCADE,
  filename     TEXT,
  content_type TEXT,
  size         INTEGER,
  data         BLOB
);
CREATE INDEX IF NOT EXISTS idx_tmailattach_mail ON TMailAttachment(mail_id);

-- ── TCalendar — lokaler Kalender-Cache (CalDAV) ───────────────────────────

CREATE TABLE IF NOT EXISTS TCalendar (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  cal_uid     TEXT UNIQUE NOT NULL,
  cal_url     TEXT,
  summary     TEXT,
  description TEXT,
  location    TEXT,
  dtstart     TEXT,
  dtend       TEXT,
  all_day     INTEGER DEFAULT 0,
  rrule       TEXT,
  status      TEXT,
  organizer   TEXT,
  raw_ical    TEXT,
  source      TEXT DEFAULT 'caldav',
  synced_at   TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tcal_dtstart ON TCalendar(dtstart);

-- ── TFCMProfile — Arbeitsprofile (global) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS TFCMProfile (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_name TEXT NOT NULL UNIQUE,
  seq          INTEGER DEFAULT 0,
  created_at   TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ── TFCMBtn — Schaltflächenkonfiguration pro Formular + Profil ───────────────

CREATE TABLE IF NOT EXISTS TFCMBtn (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  form_name        TEXT NOT NULL,
  profile_name     TEXT NOT NULL,
  nr               INTEGER NOT NULL,
  bezeichnung      TEXT,
  methode          TEXT DEFAULT 'OpenForm',
  ziel_form        TEXT,
  ziel_profil      TEXT,
  letztes_profil   INTEGER DEFAULT 0,
  abfrage          TEXT,
  bereich          TEXT,
  thema            TEXT,
  kategorie        TEXT,
  status           TEXT,
  filter           TEXT,
  filtertext       TEXT,
  sub_form1        TEXT,
  sub_form2        TEXT,
  sichtbar         INTEGER DEFAULT 1,
  nicht_schliessen INTEGER DEFAULT 0,
  neuen_datensatz  INTEGER DEFAULT 0,
  user_funktion    TEXT,
  kein_parameter   INTEGER DEFAULT 0,
  aktion           TEXT,
  param1           TEXT,
  param2           TEXT,
  param3           TEXT,
  hyper_link       TEXT,
  pic_path         TEXT,
  hilfetext        TEXT,
  created_at       TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(form_name, profile_name, nr)
);
CREATE INDEX IF NOT EXISTS idx_tfcmbtn_form_profile ON TFCMBtn(form_name, profile_name);

-- ── TTermin — Besprechungstermine (mit Uhrzeit) ──────────────────────────────

CREATE TABLE IF NOT EXISTS TTermin (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  act_id       INTEGER REFERENCES TAct(id) ON DELETE SET NULL,
  title        TEXT NOT NULL DEFAULT '',
  termin_date  TEXT NOT NULL,
  time_start   TEXT,
  time_end     TEXT,
  location     TEXT,
  notes        TEXT,
  meet_url     TEXT,
  meet_comment TEXT,
  meet_key     TEXT,
  meet_phone   TEXT,
  cat          TEXT,
  source       TEXT DEFAULT 'manual',
  cal_uid      TEXT UNIQUE,
  created_at   TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ttermin_date   ON TTermin(termin_date);
CREATE INDEX IF NOT EXISTS idx_ttermin_act_id ON TTermin(act_id);

-- ── TRecurring — periodische Aufgaben (FancyPlan-intern) ─────────────────────

CREATE TABLE IF NOT EXISTS TRecurring (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  act_id       INTEGER REFERENCES TAct(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  freq         TEXT NOT NULL DEFAULT 'daily',
  interval_val INTEGER DEFAULT 1,
  byday        TEXT,
  bymonthday   INTEGER,
  bymonth      INTEGER,
  time_start   TEXT,
  notes        TEXT,
  active       INTEGER DEFAULT 1,
  created_at   TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ── TMyData — Verschlüsselte persönliche Daten ───────────────────────────────

CREATE TABLE IF NOT EXISTS TMyData (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  category   TEXT NOT NULL DEFAULT 'other',
  label      TEXT NOT NULL DEFAULT '',
  value_enc  TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ── TActTel — Verknüpfung Aktivität ↔ Kontakt (m:n) ─────────────────────────

CREATE TABLE IF NOT EXISTS TActTel (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  IDTAct     INTEGER NOT NULL,
  IDTTel     INTEGER NOT NULL,
  role       TEXT,
  Com        TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(IDTAct, IDTTel)
);
CREATE INDEX IF NOT EXISTS idx_tacttel_act ON TActTel(IDTAct);
CREATE INDEX IF NOT EXISTS idx_tacttel_tel ON TActTel(IDTTel);

`
