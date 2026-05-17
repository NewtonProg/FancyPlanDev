/// <reference types="vite/client" />

type Row = Record<string, unknown>

interface DbApi {
  act: {
    getAll:  (filter?: Partial<Row>) => Promise<Row[]>
    getById: (id: number)            => Promise<Row | undefined>
    create:  (data: Row)             => Promise<{ id: number | bigint }>
    update:  (id: number, data: Row) => Promise<{ ok: boolean }>
    delete:  (id: number)            => Promise<{ ok: boolean }>
  }
  tel: {
    getAll:               (search?: string)   => Promise<Row[]>
    getById:              (id: number)        => Promise<Row | undefined>
    create:               (data: Row)         => Promise<{ id: number | bigint }>
    update:               (id: number, data: Row) => Promise<{ ok: boolean }>
    delete:               (id: number)        => Promise<{ ok: boolean }>
    getLetters:           ()                  => Promise<{ letter: string }[]>
    getCompaniesByLetter: (letter: string)    => Promise<{ Company: string }[]>
    getByCompany:         (company: string)   => Promise<Row[]>
    getEmailsByCompany:   (company: string)   => Promise<{ EMail1: string; EMail2: string; EMail3: string }[]>
  }
  area: {
    getAll:  ()                              => Promise<Row[]>
    create:  (data: Row)                     => Promise<{ id: number | bigint }>
    update:  (id: number, data: Row)         => Promise<{ ok: boolean }>
    delete:  (id: number)                    => Promise<{ ok: boolean }>
  }
  theme: {
    getAll:  ()                              => Promise<Row[]>
    create:  (data: Row)                     => Promise<{ id: number | bigint }>
    update:  (id: number, data: Row)         => Promise<{ ok: boolean }>
    delete:  (id: number)                    => Promise<{ ok: boolean }>
  }
  areatheme: {
    getAll:  ()                              => Promise<Row[]>
    create:  (idArea: number, idTheme: number) => Promise<{ id: number | bigint }>
    delete:  (id: number)                    => Promise<{ ok: boolean }>
  }
  cat: {
    getAll:  (formName?: string)             => Promise<Row[]>
    create:  (data: Row)                     => Promise<{ id: number | bigint }>
    update:  (id: number, data: Row)         => Promise<{ ok: boolean }>
    delete:  (id: number)                    => Promise<{ ok: boolean }>
  }
  prio: {
    getAll:  (level: 1 | 2 | 3)                              => Promise<Row[]>
    create:  (level: 1 | 2 | 3, data: Row)                   => Promise<{ id: number | bigint }>
    update:  (level: 1 | 2 | 3, id: number, data: Row)       => Promise<{ ok: boolean }>
    delete:  (level: 1 | 2 | 3, id: number)                  => Promise<{ ok: boolean }>
  }
  status: {
    getAll:  (formName?: string)             => Promise<Row[]>
    create:  (data: Row)                     => Promise<{ id: number | bigint }>
    update:  (id: number, data: Row)         => Promise<{ ok: boolean }>
    delete:  (id: number)                    => Promise<{ ok: boolean }>
  }
  land: {
    getAll:  ()                              => Promise<Row[]>
    create:  (data: Row)                     => Promise<{ id: number | bigint }>
    update:  (id: number, data: Row)         => Promise<{ ok: boolean }>
    delete:  (id: number)                    => Promise<{ ok: boolean }>
  }
  groupval: {
    getAll:  (groupNr: number, formName?: string) => Promise<Row[]>
    create:  (data: Row)                     => Promise<{ id: number | bigint }>
    update:  (id: number, data: Row)         => Promise<{ ok: boolean }>
    delete:  (id: number)                    => Promise<{ ok: boolean }>
  }
  fcmstatus: {
    getAll:       ()                              => Promise<Row[]>
    getByStatus:  (status: string)               => Promise<Row | null>
    create:       (data: Row)                     => Promise<{ id: number | bigint }>
    update:       (id: number, data: Row)         => Promise<{ ok: boolean }>
    delete:       (id: number)                    => Promise<{ ok: boolean }>
  }
  kostenstelle: {
    getAll:  ()                              => Promise<Row[]>
    create:  (data: Row)                     => Promise<{ id: number | bigint }>
    update:  (id: number, data: Row)         => Promise<{ ok: boolean }>
    delete:  (id: number)                    => Promise<{ ok: boolean }>
  }
  auftrag: {
    getAll:  ()                              => Promise<Row[]>
    create:  (data: Row)                     => Promise<{ id: number | bigint }>
    update:  (id: number, data: Row)         => Promise<{ ok: boolean }>
    delete:  (id: number)                    => Promise<{ ok: boolean }>
  }
  projekt: {
    getAll:  ()                              => Promise<Row[]>
    create:  (data: Row)                     => Promise<{ id: number | bigint }>
    update:  (id: number, data: Row)         => Promise<{ ok: boolean }>
    delete:  (id: number)                    => Promise<{ ok: boolean }>
  }
  migrate: {
    fromAccess: () => Promise<{
      canceled?: boolean
      success?: boolean
      counts?: Record<string, number>
      errors?: string[]
    }>
  }
  acttel: {
    getByAct: (actId: number)               => Promise<Row[]>
    getByTel: (telId: number)               => Promise<Row[]>
    add:      (actId: number, telId: number) => Promise<{ ok: boolean }>
    remove:   (actId: number, telId: number) => Promise<{ ok: boolean }>
  }
  ttelmail: {
    getByTel: (telId: number)               => Promise<Row[]>
    create:   (data: Row)                   => Promise<{ id: number | bigint }>
    update:   (id: number, data: Row)       => Promise<{ ok: boolean }>
    delete:   (id: number)                  => Promise<{ ok: boolean }>
  }
  ttelweb: {
    getByTel: (telId: number)               => Promise<Row[]>
    create:   (data: Row)                   => Promise<{ id: number | bigint }>
    update:   (id: number, data: Row)       => Promise<{ ok: boolean }>
    delete:   (id: number)                  => Promise<{ ok: boolean }>
  }
  actlog: {
    getByAct:    (idTAct: number) => Promise<Row[]>
    deleteByAct: (idTAct: number) => Promise<{ ok: boolean }>
    deleteAll:   ()               => Promise<{ ok: boolean }>
  }
  tree: {
    getAll:        ()                                       => Promise<Row[]>
    create:        (parentId: number | null, name: string)  => Promise<{ id: number; path: string }>
    rename:        (id: number, name: string)               => Promise<{ ok: boolean }>
    delete:        (id: number)                             => Promise<{ ok: boolean }>
    move:          (id: number, newParentId: number | null) => Promise<{ ok: boolean; error?: string }>
    setRef:        (id: number, refId: number | null)       => Promise<{ ok: boolean }>
    getActivities: (nodeName: string)                       => Promise<Row[]>
  }
  links: {
    getByEntity: (entityType: string, entityId: number) => Promise<Row[]>
    create:      (data: Row)                             => Promise<{ id: number | bigint }>
    update:      (id: number, data: Row)                 => Promise<{ ok: boolean }>
    delete:      (id: number)                            => Promise<{ ok: boolean }>
    open:        (url: string, linkType: string)         => Promise<{ ok: boolean }>
  }
  planvariant: {
    getAll:   ()                               => Promise<Row[]>
    save:     (name: string, actIds: number[]) => Promise<{ id: number; count: number }>
    load:     (variantId: number)              => Promise<{ loaded: number; actIds?: number[] }>
    delete:   (variantId: number)              => Promise<{ ok: boolean }>
    getItems: (variantId: number)              => Promise<Row[]>
  }
  settings: {
    get:    (key: string)                       => Promise<string | null>
    set:    (key: string, value: string | null) => Promise<{ ok: boolean }>
    getAll: (prefix?: string)                   => Promise<Record<string, string>>
  }
  mail: {
    authStatus: () => Promise<{ configured: boolean; email: string }>
    configTest: () => Promise<{ ok?: boolean; error?: string }>
    sync:       () => Promise<{ count: number; error?: string }>
    list:       (filter?: { search?: string; unreadOnly?: boolean }) => Promise<Row[]>
    get:        (id: number)   => Promise<Row | null>
    send:       (data: { to: string; subject: string; body: string; cc?: string }) => Promise<{ ok?: boolean; error?: string }>
    markRead:   (id: number)   => Promise<{ ok: boolean }>
  }
  export: {
    csv: (csvString: string, defaultFilename: string) => Promise<{ ok?: boolean; path?: string; canceled?: boolean; error?: string }>
  }
  gcal: {
    authStatus:  () => Promise<{ configured: boolean; email: string }>
    connect:     () => Promise<{ ok?: boolean; email?: string; error?: string }>
    disconnect:  () => Promise<{ ok: boolean }>
    sync:        () => Promise<{ count?: number; error?: string }>
  }
  cal: {
    authStatus: () => Promise<{ configured: boolean; user: string }>
    sync:       () => Promise<{ count: number; error?: string }>
    list:       (filter?: { from?: string; to?: string }) => Promise<Row[]>
    create:     (data: { summary: string; dtstart: string; dtend: string; description?: string; location?: string; allDay?: boolean }) => Promise<{ ok: boolean; uid?: string }>
    delete:     (id: number) => Promise<{ ok: boolean }>
  }
  fcm: {
    profile: {
      getAll:  ()                              => Promise<Row[]>
      create:  (profileName: string, seq?: number) => Promise<{ id: number | bigint }>
      update:  (id: number, data: Row)         => Promise<{ ok: boolean }>
      delete:  (id: number)                    => Promise<{ ok: boolean }>
    }
    btn: {
      getForms: ()                                      => Promise<string[]>
      getAll:   (formName: string, profileName: string) => Promise<Row[]>
      create:   (data: Row)                             => Promise<{ id: number | bigint }>
      update:   (id: number, data: Row)                 => Promise<{ ok: boolean }>
      delete:   (id: number)                            => Promise<{ ok: boolean }>
    }
    help: {
      open: (filename: string) => Promise<{ ok: boolean }>
    }
  }
}

declare global {
  interface Window {
    db: DbApi & {
      backup: {
        create: () => Promise<string>
      }
    }
  }
}
