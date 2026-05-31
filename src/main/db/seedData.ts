// AUTOMATISCH GENERIERT aus der gepflegten FancyPlan-Auslieferungs-DB (SQLite).
// Quelle: C:/Users/hwleo/AppData/Roaming/fancyplan/fancyplan.db
// Neu erzeugen:
//   ELECTRON_RUN_AS_NODE=1 ./node_modules/.bin/electron scripts/gen-seed-data.mjs [db]
// Inhalt: Auslieferungs-Standardwerte (Bereiche, Themen, Status, Kategorien).

export interface SeedArea { name: string; seq: number }
export interface SeedTheme { name: string; seq: number; area: string | null }
export interface SeedStatus { name: string; seq: number; form: string; theme: string | null }
export interface SeedCat { cat: string; grp: string | null; form: string; active: number; theme: string | null }

export const SEED_AREAS: SeedArea[] = [
  {
    "name": "Persönliche Entwicklung",
    "seq": 100
  },
  {
    "name": "Business",
    "seq": 150
  },
  {
    "name": "Gesundheit",
    "seq": 300
  },
  {
    "name": "Projekte",
    "seq": 400
  },
  {
    "name": "Finanzen",
    "seq": 500
  },
  {
    "name": "Verwaltung",
    "seq": 520
  },
  {
    "name": "Reisen",
    "seq": 700
  },
  {
    "name": "Privat",
    "seq": 800
  },
  {
    "name": "Versicherungen",
    "seq": 870
  },
  {
    "name": "Hobby",
    "seq": 999
  },
  {
    "name": "Internet",
    "seq": 999
  },
  {
    "name": "NA",
    "seq": 1000
  }
]

export const SEED_THEMES: SeedTheme[] = [
  {
    "name": "Bildung",
    "seq": 999,
    "area": "Privat"
  },
  {
    "name": "Business",
    "seq": 999,
    "area": "Business"
  },
  {
    "name": "Reisen",
    "seq": 1,
    "area": null
  },
  {
    "name": "Freunde",
    "seq": 2,
    "area": "Privat"
  },
  {
    "name": "Haus",
    "seq": 100,
    "area": "Privat"
  },
  {
    "name": "Post",
    "seq": 100,
    "area": null
  },
  {
    "name": "Bildung",
    "seq": 300,
    "area": "Business"
  },
  {
    "name": "Finanzen",
    "seq": 400,
    "area": null
  },
  {
    "name": "Kultur",
    "seq": 450,
    "area": "Privat"
  },
  {
    "name": "Auto",
    "seq": 500,
    "area": "Reisen"
  },
  {
    "name": "Wohnung",
    "seq": 500,
    "area": "Verwaltung"
  },
  {
    "name": "Fitness",
    "seq": 800,
    "area": "Privat"
  },
  {
    "name": "Sonstiges",
    "seq": 900,
    "area": null
  },
  {
    "name": "Steuern",
    "seq": 900,
    "area": "Privat"
  },
  {
    "name": "Freizeit",
    "seq": 990,
    "area": "Privat"
  },
  {
    "name": "Arzt",
    "seq": 999,
    "area": "Privat"
  },
  {
    "name": "Bahn",
    "seq": 999,
    "area": "Reisen"
  },
  {
    "name": "Bank",
    "seq": 999,
    "area": "Finanzen"
  },
  {
    "name": "Beauty",
    "seq": 999,
    "area": "Privat"
  },
  {
    "name": "Einkauf",
    "seq": 999,
    "area": "Privat"
  },
  {
    "name": "Ernährung",
    "seq": 999,
    "area": "Privat"
  },
  {
    "name": "Facebook",
    "seq": 999,
    "area": "Privat"
  },
  {
    "name": "Familie",
    "seq": 999,
    "area": "Privat"
  },
  {
    "name": "Film",
    "seq": 999,
    "area": "Privat"
  },
  {
    "name": "Fliegen",
    "seq": 999,
    "area": "Privat"
  },
  {
    "name": "Handwerker",
    "seq": 999,
    "area": "Privat"
  },
  {
    "name": "Hausbau",
    "seq": 999,
    "area": "Privat"
  },
  {
    "name": "Hotel",
    "seq": 999,
    "area": "Reisen"
  },
  {
    "name": "Instagram",
    "seq": 999,
    "area": "Privat"
  },
  {
    "name": "Internet",
    "seq": 999,
    "area": null
  },
  {
    "name": "Karriere",
    "seq": 999,
    "area": "Business"
  },
  {
    "name": "Kinder",
    "seq": 999,
    "area": "Privat"
  },
  {
    "name": "Konzerte",
    "seq": 999,
    "area": "Privat"
  },
  {
    "name": "Kunden",
    "seq": 999,
    "area": "Business"
  },
  {
    "name": "Mode",
    "seq": 999,
    "area": "Privat"
  },
  {
    "name": "Musik",
    "seq": 999,
    "area": "Privat"
  },
  {
    "name": "Notizen",
    "seq": 999,
    "area": null
  },
  {
    "name": "Studium",
    "seq": 999,
    "area": "Verwaltung"
  },
  {
    "name": "Telefon",
    "seq": 999,
    "area": "Verwaltung"
  },
  {
    "name": "Urlaub",
    "seq": 999,
    "area": "Privat"
  },
  {
    "name": "Verein",
    "seq": 999,
    "area": "Privat"
  },
  {
    "name": "Versicherung",
    "seq": 999,
    "area": "Verwaltung"
  },
  {
    "name": "Web",
    "seq": 999,
    "area": null
  },
  {
    "name": "YouTube",
    "seq": 999,
    "area": "Privat"
  },
  {
    "name": "Netzwerk",
    "seq": 1100,
    "area": null
  },
  {
    "name": "PC",
    "seq": 2000,
    "area": null
  },
  {
    "name": "Privat",
    "seq": 2000,
    "area": null
  },
  {
    "name": "NA",
    "seq": 9000,
    "area": null
  }
]

export const SEED_STATUS: SeedStatus[] = [
  {
    "name": "Archiv",
    "seq": 0,
    "form": "*",
    "theme": null
  },
  {
    "name": "Dach fertig",
    "seq": 0,
    "form": "FAct",
    "theme": "Hausbau"
  },
  {
    "name": "Info",
    "seq": 0,
    "form": "*",
    "theme": null
  },
  {
    "name": "No Action",
    "seq": 0,
    "form": "*",
    "theme": null
  },
  {
    "name": "Ticket ist gekauft",
    "seq": 0,
    "form": "*",
    "theme": "Reisen"
  },
  {
    "name": "abgeschlossen",
    "seq": 0,
    "form": "*",
    "theme": null
  },
  {
    "name": "auf Antwort warten",
    "seq": 0,
    "form": "*",
    "theme": null
  },
  {
    "name": "bezahlen",
    "seq": 0,
    "form": "*",
    "theme": null
  },
  {
    "name": "eröffnet",
    "seq": 0,
    "form": "*",
    "theme": null
  },
  {
    "name": "geschlossen",
    "seq": 0,
    "form": "*",
    "theme": null
  },
  {
    "name": "in Arbeit",
    "seq": 0,
    "form": "*",
    "theme": null
  },
  {
    "name": "warte auf  ZE",
    "seq": 0,
    "form": "*",
    "theme": null
  }
]

export const SEED_CATS: SeedCat[] = [
  {
    "cat": "Kunden",
    "grp": "Business",
    "form": "FAct",
    "active": 0,
    "theme": "Business"
  },
  {
    "cat": "Bildung",
    "grp": "Bildung",
    "form": "*",
    "active": 0,
    "theme": "Bildung"
  },
  {
    "cat": "Kunst",
    "grp": "Kultur",
    "form": "*",
    "active": 0,
    "theme": "Kultur"
  },
  {
    "cat": "Musik",
    "grp": "Kultur",
    "form": "*",
    "active": 0,
    "theme": "Kultur"
  },
  {
    "cat": "Kultur",
    "grp": "Kultur",
    "form": "*",
    "active": 0,
    "theme": "Kultur"
  },
  {
    "cat": "KI",
    "grp": "Bildung",
    "form": "*",
    "active": 0,
    "theme": "Bildung"
  },
  {
    "cat": "aktuelles Projekt",
    "grp": "Privat",
    "form": "*",
    "active": 0,
    "theme": "Privat"
  },
  {
    "cat": "Projekt1",
    "grp": "Business",
    "form": "*",
    "active": 0,
    "theme": "Business"
  },
  {
    "cat": "Projekt2",
    "grp": "Business",
    "form": "*",
    "active": 0,
    "theme": "Business"
  },
  {
    "cat": "Notiz",
    "grp": "Aktuell",
    "form": "*",
    "active": 0,
    "theme": null
  },
  {
    "cat": "Web",
    "grp": "Internet",
    "form": "*",
    "active": 0,
    "theme": "Internet"
  },
  {
    "cat": "Handwerker/Helfer",
    "grp": "Kontakte",
    "form": "*",
    "active": 0,
    "theme": null
  },
  {
    "cat": "PC",
    "grp": "PC",
    "form": "*",
    "active": 0,
    "theme": "PC"
  },
  {
    "cat": "Software",
    "grp": "PC",
    "form": "*",
    "active": 0,
    "theme": "PC"
  },
  {
    "cat": "Dienstleister",
    "grp": "Privat",
    "form": "*",
    "active": 0,
    "theme": "Privat"
  },
  {
    "cat": "Einkaufen",
    "grp": "Privat",
    "form": "*",
    "active": 0,
    "theme": "Privat"
  },
  {
    "cat": "Freizeit",
    "grp": "Privat",
    "form": "*",
    "active": 0,
    "theme": "Privat"
  },
  {
    "cat": "Freunde",
    "grp": "Privat",
    "form": "*",
    "active": 0,
    "theme": "Privat"
  },
  {
    "cat": "Gesundheit",
    "grp": "Privat",
    "form": "*",
    "active": 0,
    "theme": "Privat"
  },
  {
    "cat": "Golf",
    "grp": "Privat",
    "form": "*",
    "active": 0,
    "theme": "Privat"
  },
  {
    "cat": "Haus und Mieten",
    "grp": "Privat",
    "form": "*",
    "active": 0,
    "theme": "Privat"
  },
  {
    "cat": "Hausverkauf",
    "grp": "Privat",
    "form": "*",
    "active": 0,
    "theme": "Privat"
  },
  {
    "cat": "Hausbau",
    "grp": "Hausbau",
    "form": "*",
    "active": 0,
    "theme": "Hausbau"
  },
  {
    "cat": "intern",
    "grp": "Privat",
    "form": "*",
    "active": 0,
    "theme": "Privat"
  },
  {
    "cat": "Möbel",
    "grp": "Privat",
    "form": "*",
    "active": 0,
    "theme": "Privat"
  },
  {
    "cat": "NA",
    "grp": "Privat",
    "form": "*",
    "active": 0,
    "theme": "Privat"
  },
  {
    "cat": "Privat",
    "grp": "Privat",
    "form": "*",
    "active": 0,
    "theme": "Privat"
  },
  {
    "cat": "Restaurant",
    "grp": "Privat",
    "form": "*",
    "active": 0,
    "theme": "Privat"
  },
  {
    "cat": "sonstiges",
    "grp": "Privat",
    "form": "*",
    "active": 0,
    "theme": "Privat"
  },
  {
    "cat": "Telefon",
    "grp": "Privat",
    "form": "*",
    "active": 0,
    "theme": "Privat"
  },
  {
    "cat": "Umzug",
    "grp": "Privat",
    "form": "*",
    "active": 0,
    "theme": "Privat"
  },
  {
    "cat": "Wohnen",
    "grp": "Privat",
    "form": "*",
    "active": 0,
    "theme": "Privat"
  },
  {
    "cat": "Auto mieten",
    "grp": "Reisen",
    "form": "*",
    "active": 0,
    "theme": "Reisen"
  },
  {
    "cat": "Fliegen",
    "grp": "Reisen",
    "form": "*",
    "active": 0,
    "theme": "Reisen"
  },
  {
    "cat": "Hotel",
    "grp": "Reisen",
    "form": "*",
    "active": 0,
    "theme": "Reisen"
  },
  {
    "cat": "Urlaub",
    "grp": "Reisen",
    "form": "*",
    "active": 0,
    "theme": "Reisen"
  },
  {
    "cat": "Versicherung",
    "grp": "Versicherung",
    "form": "*",
    "active": 0,
    "theme": "Versicherung"
  },
  {
    "cat": "intern",
    "grp": "Steuern",
    "form": "*",
    "active": 0,
    "theme": "Steuern"
  },
  {
    "cat": "MonatEnde",
    "grp": "Steuern",
    "form": "*",
    "active": 0,
    "theme": "Steuern"
  },
  {
    "cat": "Post",
    "grp": "*",
    "form": "*",
    "active": 0,
    "theme": null
  },
  {
    "cat": "Auto",
    "grp": "Versicherung",
    "form": "*",
    "active": 0,
    "theme": "Versicherung"
  },
  {
    "cat": "Ausland",
    "grp": "Finanzen",
    "form": "*",
    "active": 0,
    "theme": "Finanzen"
  },
  {
    "cat": "A-Zahlung",
    "grp": "Finanzen",
    "form": "*",
    "active": 0,
    "theme": "Finanzen"
  },
  {
    "cat": "Bank",
    "grp": "Finanzen",
    "form": "*",
    "active": 0,
    "theme": "Finanzen"
  },
  {
    "cat": "Crypto",
    "grp": "Finanzen",
    "form": "*",
    "active": 0,
    "theme": "Finanzen"
  },
  {
    "cat": "Einkaufen",
    "grp": "Finanzen",
    "form": "*",
    "active": 0,
    "theme": "Finanzen"
  },
  {
    "cat": "EKSt",
    "grp": "Steuern",
    "form": "FAct",
    "active": 0,
    "theme": "Steuern"
  },
  {
    "cat": "E-Zahlung",
    "grp": "Finanzen",
    "form": "*",
    "active": 0,
    "theme": "Finanzen"
  },
  {
    "cat": "Fi-Anlage",
    "grp": "Finanzen",
    "form": "*",
    "active": 0,
    "theme": "Finanzen"
  },
  {
    "cat": "Fi-Kredite",
    "grp": "Finanzen",
    "form": "*",
    "active": 0,
    "theme": "Finanzen"
  },
  {
    "cat": "Fi-Org",
    "grp": "Finanzen",
    "form": "*",
    "active": 0,
    "theme": "Finanzen"
  },
  {
    "cat": "Trading",
    "grp": "Finanzen",
    "form": "*",
    "active": 0,
    "theme": "Finanzen"
  },
  {
    "cat": "Finanzen",
    "grp": "Hausbau",
    "form": "*",
    "active": 1,
    "theme": "Hausbau"
  },
  {
    "cat": "Bank",
    "grp": "Hausbau",
    "form": "*",
    "active": 1,
    "theme": "Hausbau"
  },
  {
    "cat": "Bank",
    "grp": "Bank",
    "form": "FAct",
    "active": 1,
    "theme": "Bank"
  }
]
