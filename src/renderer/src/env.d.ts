/// <reference types="vite/client" />

type Row = Record<string, unknown>

interface DbApi {
  act: {
    getAll:  (filter?: Partial<Row>) => Promise<Row[]>
    getById: (id: number)            => Promise<Row | undefined>
    create:  (data: Row)             => Promise<{ id: number | bigint }>
    update:  (id: number, data: Row) => Promise<{ ok: boolean }>
    delete:  (id: number)            => Promise<{ ok: boolean }>
    recent:  (limit?: number)        => Promise<Row[]>
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
    getByCat:             (cat: string)       => Promise<Row[]>
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
    getByAct:  (actId: number)                    => Promise<Row[]>
    getByTel:  (telId: number)                    => Promise<Row[]>
    add:       (actId: number, telId: number)     => Promise<{ ok: boolean }>
    remove:    (actId: number, telId: number)     => Promise<{ ok: boolean }>
    updateCom: (acttelId: number, com: string)    => Promise<{ ok: boolean }>
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
    pickPath:    (opts?: { defaultPath?: string; mode?: 'file' | 'directory' | 'both' }) => Promise<{ path: string | null }>
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
    authStatus:         () => Promise<{ configured: boolean; email: string }>
    configTest:         () => Promise<{ ok?: boolean; error?: string }>
    sync:               () => Promise<{ count: number; error?: string }>
    list:               (filter?: { search?: string; unreadOnly?: boolean }) => Promise<Row[]>
    get:                (id: number)   => Promise<Row | null>
    send:               (data: { to: string; subject: string; body: string; cc?: string }) => Promise<{ ok?: boolean; error?: string }>
    markRead:           (id: number)   => Promise<{ ok: boolean }>
    delete:             (id: number)   => Promise<{ ok: boolean }>
    getAttachments:     (mailId: number) => Promise<Row[]>
    downloadAttachment: (attachmentId: number) => Promise<{ ok: boolean; canceled?: boolean; error?: string }>
  }
  export: {
    csv:        (csvString: string, defaultFilename: string) => Promise<{ ok?: boolean; path?: string; canceled?: boolean; error?: string }>
    jsonExport: () => Promise<{ ok?: boolean; path?: string; total?: number; canceled?: boolean; error?: string }>
    jsonImport: () => Promise<{ ok?: boolean; counts?: Record<string, number>; canceled?: boolean; error?: string }>
  }
  gcal: {
    authStatus:  () => Promise<{ configured: boolean; email: string }>
    connect:     () => Promise<{ ok?: boolean; email?: string; error?: string }>
    disconnect:  () => Promise<{ ok: boolean }>
    sync:        () => Promise<{ count?: number; pushed?: number; error?: string }>
  }
  cloud: {
    authStatus:     () => Promise<{ configured: boolean; loggedIn: boolean; email: string }>
    login:          (email: string, password: string) => Promise<{ ok?: boolean; email?: string; error?: string }>
    logout:         () => Promise<{ ok: boolean }>
    pushRefData:    () => Promise<{ ok: boolean; error?: string }>
    pushFcmRules:   () => Promise<{ ok: boolean; count?: number; error?: string }>
    pushActivities: () => Promise<{ ok: boolean; pushed?: number; created?: number; updated?: number; error?: string }>
    pull:           () => Promise<{ ok: boolean; imported?: number; created?: number; error?: string }>
    syncAll:        () => Promise<{ ok?: boolean; pushed?: number; pulled?: number; created?: number; updated?: number; error?: string }>
  }
  cal: {
    authStatus: () => Promise<{ configured: boolean; user: string }>
    sync:       () => Promise<{ count: number; error?: string }>
    list:       (filter?: { from?: string; to?: string }) => Promise<Row[]>
    create:     (data: { summary: string; dtstart: string; dtend: string; description?: string; location?: string; allDay?: boolean }) => Promise<{ ok: boolean; uid?: string }>
    delete:     (id: number) => Promise<{ ok: boolean }>
  }
  termin: {
    getByDate:       (date: string)                             => Promise<Row[]>
    getByDateRange:  (from: string, to: string)                 => Promise<Row[]>
    getByAct:        (actId: number)                            => Promise<Row[]>
    create:          (data: Row)                                => Promise<Row>
    update:          (id: number, data: Row)                    => Promise<boolean>
    delete:          (id: number)                               => Promise<boolean>
    upsertFromSync:         (data: Row)                                => Promise<boolean>
    countSeriesFromDate:    (pattern: string, fromDate: string)        => Promise<number>
    deleteSeriesFromDate:   (pattern: string, fromDate: string)        => Promise<{ deleted: number; gcalAction: 'deleted' | 'truncated' | 'skipped' | 'failed'; gcalError: string | null }>
    countByTitleFromDate:   (title: string,   fromDate: string)        => Promise<number>
    deleteByTitleFromDate:  (title: string,   fromDate: string)        => Promise<{ deleted: number; gcalDeleted: number; gcalErrors: string[] }>
    createSeries:               (data: Row, rec: Row)                       => Promise<{ master: string; count: number }>
    countLocalSeriesFromDate:   (recMaster: string, fromDate: string)        => Promise<number>
    deleteLocalSeriesFromDate:  (recMaster: string, fromDate: string)        => Promise<{ deleted: number }>
    updateLocalSeriesFromDate:  (recMaster: string, fromDate: string, data: Row) => Promise<boolean>
    updateGcalSeries:           (recMaster: string, data: Row) => Promise<{ ok: boolean; gcalAction: 'patched' | 'skipped' | 'failed'; gcalError: string | null }>
  }
  recurring: {
    getAll:     ()                          => Promise<Row[]>
    isDueToday: (date: string)              => Promise<Row[]>
    create:     (data: Row)                 => Promise<Row>
    update:     (id: number, data: Row)     => Promise<boolean>
    delete:     (id: number)               => Promise<boolean>
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
  help: {
    open: (key: string, lang?: string) => Promise<void>
  }
}

type UpdateStatus = 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
type UpdateEvent = { status: UpdateStatus; version?: string; progress?: number; message?: string }

type LicenseInfo = {
  key: string | null
  tier: string
  trialDays: number
  trialExpired: boolean
  validatedAt: string | null
}

declare global {
  interface Window {
    db: DbApi & {
      backup: {
        create: () => Promise<string>
        export: () => Promise<{ ok: boolean; path?: string }>
        import: () => Promise<{ ok: boolean; canceled?: boolean; error?: string }>
      }
      dbConfig: {
        getPath:    () => Promise<string>
        browsePath: () => Promise<string | null>
        setPath:    (p: string) => Promise<{ ok: boolean }>
        copyAndSet: (p: string) => Promise<{ ok: boolean; error?: string }>
        relaunch:   () => Promise<void>
        quit:       () => Promise<void>
        reset:      () => Promise<{ ok: boolean; error?: string }>
      }
      license: {
        get:      () => Promise<LicenseInfo>
        activate: (key: string) => Promise<{ ok: boolean; tier?: string; error?: string }>
        validate: () => Promise<{ ok: boolean; tier?: string; reason?: string }>
        reset:    () => Promise<{ ok: boolean }>
      }
      update: {
        check:   () => Promise<UpdateEvent>
        status:  () => Promise<UpdateEvent>
        install: () => Promise<void>
        onEvent: (cb: (e: UpdateEvent) => void) => () => void
      }
      brand: {
        browseLogo: () => Promise<string | null>
      }
    }
  }
}
