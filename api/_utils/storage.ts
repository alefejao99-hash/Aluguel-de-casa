import fs from 'fs';
import path from 'path';
import { Redis } from '@upstash/redis';
import type { Property } from '../../src/types';

export type Stats = {
  visitorCount: number;
  groupClicksCount: number;
  likes: number;
  dislikes: number;
};

const PROPERTIES_KEY = 'divulga_casas:properties';
const STATS_KEY = 'divulga_casas:stats';
const LOCAL_PROPERTIES_FILE = path.join(process.cwd(), 'properties-data.json');
const LOCAL_STATS_FILE = path.join(process.cwd(), 'stats-data.json');

const EMPTY_PROPERTIES: Property[] = [];
const REMOVED_DEFAULT_PROPERTY_IDS = new Set([
  'casa-parnaiba-1',
  'casa-pedrasal-2',
  'casa-coqueiro-3',
  'casa-parnaiba-4',
]);

function removeBuiltInDefaultProperties(properties: Property[]): { properties: Property[]; changed: boolean } {
  const cleaned = Array.isArray(properties)
    ? properties.filter((property) => !REMOVED_DEFAULT_PROPERTY_IDS.has(property.id))
    : [];

  return {
    properties: cleaned,
    changed: cleaned.length !== (Array.isArray(properties) ? properties.length : 0),
  };
}

export const DEFAULT_STATS: Stats = {
  visitorCount: 1487,
  groupClicksCount: 452,
  likes: 184,
  dislikes: 12,
};

let redis: Redis | null | undefined;

function getRedis() {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

function requireStorage() {
  if (getRedis()) return;
  if (process.env.VERCEL) {
    throw Object.assign(new Error('Configure UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN na Vercel.'), { status: 500 });
  }
}

function readLocalJson<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
      return fallback;
    }
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function writeLocalJson<T>(file: string, data: T) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export async function getProperties(): Promise<Property[]> {
  const r = getRedis();
  if (r) {
    const value = await r.get<Property[]>(PROPERTIES_KEY);
    if (Array.isArray(value)) {
      const result = removeBuiltInDefaultProperties(value);
      if (result.changed) await r.set(PROPERTIES_KEY, result.properties);
      return result.properties;
    }

    await r.set(PROPERTIES_KEY, EMPTY_PROPERTIES);
    return EMPTY_PROPERTIES;
  }

  requireStorage();
  const result = removeBuiltInDefaultProperties(
    readLocalJson<Property[]>(LOCAL_PROPERTIES_FILE, EMPTY_PROPERTIES),
  );
  if (result.changed) writeLocalJson(LOCAL_PROPERTIES_FILE, result.properties);
  return result.properties;
}

export async function saveProperties(properties: Property[]) {
  const result = removeBuiltInDefaultProperties(properties);
  const r = getRedis();
  if (r) {
    await r.set(PROPERTIES_KEY, result.properties);
    return;
  }
  requireStorage();
  writeLocalJson(LOCAL_PROPERTIES_FILE, result.properties);
}

function normalizeStats(input: Partial<Record<keyof Stats, unknown>> | null | undefined): Stats {
  return {
    visitorCount: Number(input?.visitorCount ?? DEFAULT_STATS.visitorCount),
    groupClicksCount: Number(input?.groupClicksCount ?? DEFAULT_STATS.groupClicksCount),
    likes: Number(input?.likes ?? DEFAULT_STATS.likes),
    dislikes: Number(input?.dislikes ?? DEFAULT_STATS.dislikes),
  };
}

export async function getStats(): Promise<Stats> {
  const r = getRedis();
  if (r) {
    const data = await r.hgetall<Record<keyof Stats, string | number>>(STATS_KEY);
    if (data && Object.keys(data).length > 0) return normalizeStats(data);
    await r.hset(STATS_KEY, DEFAULT_STATS);
    return DEFAULT_STATS;
  }
  requireStorage();
  return normalizeStats(readLocalJson<Stats>(LOCAL_STATS_FILE, DEFAULT_STATS));
}

export async function incrementStat(field: keyof Stats, amount = 1): Promise<Stats> {
  const r = getRedis();
  if (r) {
    const exists = await r.exists(STATS_KEY);
    if (!exists) await r.hset(STATS_KEY, DEFAULT_STATS);
    await r.hincrby(STATS_KEY, field, amount);
    return getStats();
  }
  requireStorage();
  const current = await getStats();
  const next = { ...current, [field]: current[field] + amount };
  writeLocalJson(LOCAL_STATS_FILE, next);
  return next;
}
