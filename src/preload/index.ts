import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const dbApi = {
  act: {
    getAll:  (filter?: Record<string, unknown>) => ipcRenderer.invoke('db:act:getAll', filter),
    getById: (id: number)                        => ipcRenderer.invoke('db:act:getById', id),
    create:  (data: Record<string, unknown>)     => ipcRenderer.invoke('db:act:create', data),
    update:  (id: number, data: Record<string, unknown>) => ipcRenderer.invoke('db:act:update', id, data),
    delete:  (id: number)                        => ipcRenderer.invoke('db:act:delete', id)
  },
  tel: {
    getAll:               (search?: string)                   => ipcRenderer.invoke('db:tel:getAll', search),
    getById:              (id: number)                        => ipcRenderer.invoke('db:tel:getById', id),
    create:               (data: Record<string, unknown>)     => ipcRenderer.invoke('db:tel:create', data),
    update:               (id: number, data: Record<string, unknown>) => ipcRenderer.invoke('db:tel:update', id, data),
    delete:               (id: number)                        => ipcRenderer.invoke('db:tel:delete', id),
    getLetters:           ()                                  => ipcRenderer.invoke('db:tel:getLetters'),
    getCompaniesByLetter: (letter: string)                    => ipcRenderer.invoke('db:tel:getCompaniesByLetter', letter),
    getByCompany:         (company: string)                   => ipcRenderer.invoke('db:tel:getByCompany', company),
    getEmailsByCompany:   (company: string)                   => ipcRenderer.invoke('db:tel:getEmailsByCompany', company)
  },
  area: {
    getAll:  ()                                           => ipcRenderer.invoke('db:area:getAll'),
    create:  (data: Record<string, unknown>)              => ipcRenderer.invoke('db:area:create', data),
    update:  (id: number, data: Record<string, unknown>)  => ipcRenderer.invoke('db:area:update', id, data),
    delete:  (id: number)                                 => ipcRenderer.invoke('db:area:delete', id)
  },
  theme: {
    getAll:  ()                                           => ipcRenderer.invoke('db:theme:getAll'),
    create:  (data: Record<string, unknown>)              => ipcRenderer.invoke('db:theme:create', data),
    update:  (id: number, data: Record<string, unknown>)  => ipcRenderer.invoke('db:theme:update', id, data),
    delete:  (id: number)                                 => ipcRenderer.invoke('db:theme:delete', id)
  },
  areatheme: {
    getAll:  ()                                 => ipcRenderer.invoke('db:areatheme:getAll'),
    create:  (idArea: number, idTheme: number)  => ipcRenderer.invoke('db:areatheme:create', idArea, idTheme),
    delete:  (id: number)                       => ipcRenderer.invoke('db:areatheme:delete', id)
  },
  cat: {
    getAll:  (formName?: string)                          => ipcRenderer.invoke('db:cat:getAll', formName),
    create:  (data: Record<string, unknown>)              => ipcRenderer.invoke('db:cat:create', data),
    update:  (id: number, data: Record<string, unknown>)  => ipcRenderer.invoke('db:cat:update', id, data),
    delete:  (id: number)                                 => ipcRenderer.invoke('db:cat:delete', id)
  },
  prio: {
    getAll:  (level: 1 | 2 | 3)                                              => ipcRenderer.invoke('db:prio:getAll', level),
    create:  (level: 1 | 2 | 3, data: Record<string, unknown>)               => ipcRenderer.invoke('db:prio:create', level, data),
    update:  (level: 1 | 2 | 3, id: number, data: Record<string, unknown>)   => ipcRenderer.invoke('db:prio:update', level, id, data),
    delete:  (level: 1 | 2 | 3, id: number)                                  => ipcRenderer.invoke('db:prio:delete', level, id)
  },
  status: {
    getAll:  (formName?: string)                          => ipcRenderer.invoke('db:status:getAll', formName),
    create:  (data: Record<string, unknown>)              => ipcRenderer.invoke('db:status:create', data),
    update:  (id: number, data: Record<string, unknown>)  => ipcRenderer.invoke('db:status:update', id, data),
    delete:  (id: number)                                 => ipcRenderer.invoke('db:status:delete', id)
  },
  land: {
    getAll:  ()                                           => ipcRenderer.invoke('db:land:getAll'),
    create:  (data: Record<string, unknown>)              => ipcRenderer.invoke('db:land:create', data),
    update:  (id: number, data: Record<string, unknown>)  => ipcRenderer.invoke('db:land:update', id, data),
    delete:  (id: number)                                 => ipcRenderer.invoke('db:land:delete', id)
  },
  groupval: {
    getAll:  (groupNr: number, formName?: string)         => ipcRenderer.invoke('db:groupval:getAll', groupNr, formName),
    create:  (data: Record<string, unknown>)              => ipcRenderer.invoke('db:groupval:create', data),
    update:  (id: number, data: Record<string, unknown>)  => ipcRenderer.invoke('db:groupval:update', id, data),
    delete:  (id: number)                                 => ipcRenderer.invoke('db:groupval:delete', id)
  },
  fcmstatus: {
    getAll:       ()                                           => ipcRenderer.invoke('db:fcmstatus:getAll'),
    getByStatus:  (status: string)                            => ipcRenderer.invoke('db:fcmstatus:getByStatus', status),
    create:       (data: Record<string, unknown>)              => ipcRenderer.invoke('db:fcmstatus:create', data),
    update:       (id: number, data: Record<string, unknown>)  => ipcRenderer.invoke('db:fcmstatus:update', id, data),
    delete:       (id: number)                                 => ipcRenderer.invoke('db:fcmstatus:delete', id)
  },
  kostenstelle: {
    getAll:  ()                                           => ipcRenderer.invoke('db:kostenstelle:getAll'),
    create:  (data: Record<string, unknown>)              => ipcRenderer.invoke('db:kostenstelle:create', data),
    update:  (id: number, data: Record<string, unknown>)  => ipcRenderer.invoke('db:kostenstelle:update', id, data),
    delete:  (id: number)                                 => ipcRenderer.invoke('db:kostenstelle:delete', id)
  },
  auftrag: {
    getAll:  ()                                           => ipcRenderer.invoke('db:auftrag:getAll'),
    create:  (data: Record<string, unknown>)              => ipcRenderer.invoke('db:auftrag:create', data),
    update:  (id: number, data: Record<string, unknown>)  => ipcRenderer.invoke('db:auftrag:update', id, data),
    delete:  (id: number)                                 => ipcRenderer.invoke('db:auftrag:delete', id)
  },
  projekt: {
    getAll:  ()                                           => ipcRenderer.invoke('db:projekt:getAll'),
    create:  (data: Record<string, unknown>)              => ipcRenderer.invoke('db:projekt:create', data),
    update:  (id: number, data: Record<string, unknown>)  => ipcRenderer.invoke('db:projekt:update', id, data),
    delete:  (id: number)                                 => ipcRenderer.invoke('db:projekt:delete', id)
  },
  migrate: { fromAccess: ()             => ipcRenderer.invoke('db:migrate:fromAccess')    },
  acttel: {
    getByAct: (actId: number)              => ipcRenderer.invoke('db:acttel:getByAct', actId),
    getByTel: (telId: number)              => ipcRenderer.invoke('db:acttel:getByTel', telId),
    add:      (actId: number, telId: number) => ipcRenderer.invoke('db:acttel:add', actId, telId),
    remove:   (actId: number, telId: number) => ipcRenderer.invoke('db:acttel:remove', actId, telId)
  },
  ttelmail: {
    getByTel: (telId: number)                                    => ipcRenderer.invoke('db:ttelmail:getByTel', telId),
    create:   (data: Record<string, unknown>)                    => ipcRenderer.invoke('db:ttelmail:create', data),
    update:   (id: number, data: Record<string, unknown>)        => ipcRenderer.invoke('db:ttelmail:update', id, data),
    delete:   (id: number)                                       => ipcRenderer.invoke('db:ttelmail:delete', id)
  },
  ttelweb: {
    getByTel: (telId: number)                                    => ipcRenderer.invoke('db:ttelweb:getByTel', telId),
    create:   (data: Record<string, unknown>)                    => ipcRenderer.invoke('db:ttelweb:create', data),
    update:   (id: number, data: Record<string, unknown>)        => ipcRenderer.invoke('db:ttelweb:update', id, data),
    delete:   (id: number)                                       => ipcRenderer.invoke('db:ttelweb:delete', id)
  },
  actlog: {
    getByAct:    (idTAct: number) => ipcRenderer.invoke('db:actlog:getByAct', idTAct),
    deleteByAct: (idTAct: number) => ipcRenderer.invoke('db:actlog:deleteByAct', idTAct),
    deleteAll:   ()               => ipcRenderer.invoke('db:actlog:deleteAll')
  },
  tree: {
    getAll:         ()                                      => ipcRenderer.invoke('db:tree:getAll'),
    create:         (parentId: number | null, name: string) => ipcRenderer.invoke('db:tree:create', parentId, name),
    rename:         (id: number, name: string)              => ipcRenderer.invoke('db:tree:rename', id, name),
    delete:         (id: number)                            => ipcRenderer.invoke('db:tree:delete', id),
    move:           (id: number, newParentId: number | null)=> ipcRenderer.invoke('db:tree:move', id, newParentId),
    setRef:         (id: number, refId: number | null)      => ipcRenderer.invoke('db:tree:setRef', id, refId),
    getActivities:  (nodeName: string)                      => ipcRenderer.invoke('db:tree:getActivities', nodeName)
  },
  links: {
    getByEntity: (entityType: string, entityId: number) => ipcRenderer.invoke('db:links:getByEntity', entityType, entityId),
    create:      (data: Record<string, unknown>)         => ipcRenderer.invoke('db:links:create', data),
    update:      (id: number, data: Record<string, unknown>) => ipcRenderer.invoke('db:links:update', id, data),
    delete:      (id: number)                            => ipcRenderer.invoke('db:links:delete', id),
    open:        (url: string, linkType: string)         => ipcRenderer.invoke('db:links:open', url, linkType)
  },
  planvariant: {
    getAll:    ()                                    => ipcRenderer.invoke('db:planvariant:getAll'),
    save:      (name: string, actIds: number[])      => ipcRenderer.invoke('db:planvariant:save', name, actIds),
    load:      (variantId: number)                   => ipcRenderer.invoke('db:planvariant:load', variantId),
    delete:    (variantId: number)                   => ipcRenderer.invoke('db:planvariant:delete', variantId),
    getItems:  (variantId: number)                   => ipcRenderer.invoke('db:planvariant:getItems', variantId)
  },
  settings: {
    get:    (key: string)                      => ipcRenderer.invoke('settings:get', key),
    set:    (key: string, value: string | null) => ipcRenderer.invoke('settings:set', key, value),
    getAll: (prefix?: string)                  => ipcRenderer.invoke('settings:getAll', prefix)
  },
  mail: {
    authStatus: ()                                  => ipcRenderer.invoke('mail:auth:status'),
    configTest: ()                                  => ipcRenderer.invoke('mail:config:test'),
    sync:       ()                                  => ipcRenderer.invoke('mail:sync'),
    list:       (filter?: Record<string, unknown>)  => ipcRenderer.invoke('mail:list', filter),
    get:        (id: number)                        => ipcRenderer.invoke('mail:get', id),
    send:       (data: Record<string, unknown>)     => ipcRenderer.invoke('mail:send', data),
    markRead:   (id: number)                        => ipcRenderer.invoke('mail:markRead', id)
  },
  cal: {
    authStatus: ()                                      => ipcRenderer.invoke('cal:auth:status'),
    sync:       ()                                      => ipcRenderer.invoke('cal:sync'),
    list:       (filter?: Record<string, unknown>)      => ipcRenderer.invoke('cal:list', filter),
    create:     (data: Record<string, unknown>)         => ipcRenderer.invoke('cal:create', data),
    delete:     (id: number)                            => ipcRenderer.invoke('cal:delete', id)
  },
  export: {
    csv: (csvString: string, defaultFilename: string) => ipcRenderer.invoke('export:csv', csvString, defaultFilename)
  },
  gcal: {
    authStatus:  ()                             => ipcRenderer.invoke('gcal:auth:status'),
    connect:     ()                             => ipcRenderer.invoke('gcal:auth:connect'),
    disconnect:  ()                             => ipcRenderer.invoke('gcal:auth:disconnect'),
    sync:        ()                             => ipcRenderer.invoke('gcal:sync')
  },
  termin: {
    getByDate:       (date: string)                            => ipcRenderer.invoke('termin:getByDate', date),
    getByAct:        (actId: number)                           => ipcRenderer.invoke('termin:getByAct', actId),
    create:          (data: Record<string, unknown>)            => ipcRenderer.invoke('termin:create', data),
    update:          (id: number, data: Record<string, unknown>) => ipcRenderer.invoke('termin:update', id, data),
    delete:          (id: number)                              => ipcRenderer.invoke('termin:delete', id),
    upsertFromSync:  (data: Record<string, unknown>)            => ipcRenderer.invoke('termin:upsertFromSync', data)
  },
  recurring: {
    getAll:      ()                          => ipcRenderer.invoke('recurring:getAll'),
    isDueToday:  (date: string)              => ipcRenderer.invoke('recurring:isDueToday', date),
    create:      (data: Record<string, unknown>) => ipcRenderer.invoke('recurring:create', data),
    update:      (id: number, data: Record<string, unknown>) => ipcRenderer.invoke('recurring:update', id, data),
    delete:      (id: number)               => ipcRenderer.invoke('recurring:delete', id)
  },
  fcm: {
    profile: {
      getAll:  ()                                          => ipcRenderer.invoke('fcm:profile:getAll'),
      create:  (profileName: string, seq?: number)        => ipcRenderer.invoke('fcm:profile:create', profileName, seq ?? 0),
      update:  (id: number, data: Record<string, unknown>) => ipcRenderer.invoke('fcm:profile:update', id, data),
      delete:  (id: number)                               => ipcRenderer.invoke('fcm:profile:delete', id)
    },
    btn: {
      getForms: ()                                          => ipcRenderer.invoke('fcm:btn:getForms'),
      getAll:   (formName: string, profileName: string)     => ipcRenderer.invoke('fcm:btn:getAll', formName, profileName),
      create:   (data: Record<string, unknown>)             => ipcRenderer.invoke('fcm:btn:create', data),
      update:   (id: number, data: Record<string, unknown>) => ipcRenderer.invoke('fcm:btn:update', id, data),
      delete:   (id: number)                                => ipcRenderer.invoke('fcm:btn:delete', id)
    },
    help: {
      open: (filename: string) => ipcRenderer.invoke('fcm:help:open', filename)
    }
  },
  backup: {
    create: () => ipcRenderer.invoke('db:backup:create')
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('db', dbApi)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.db = dbApi
}
