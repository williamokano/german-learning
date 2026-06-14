// Composition root — constructs and wires core services
// Swap LocalStorageStorage → ApiStorage here when the backend arrives (P6);
// no widget, lesson, or scoring code changes.

import { LocalStorageStorage } from '@core/services/storage';
import { ProgressService } from '@core/services/progress';
import { AudioService } from '@core/services/audio';
import { ContentService } from '@core/services/content';

import.meta.env.BASE_URL;

const storage  = new LocalStorageStorage();
const progress = new ProgressService(storage);
const audio    = new AudioService(import.meta.env.BASE_URL);
const content  = new ContentService();

export { storage, progress, audio, content };
export type { StorageService }   from '@core/services/storage';
export type { CourseProgress }   from '@core/services/progress';
export type { AudioServiceInterface } from '@core/services/audio';
