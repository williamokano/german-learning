// Composition root — constructs and wires core services
// Swap LocalStorageStorage → ApiStorage here when the backend arrives (P6);
// no widget, lesson, or scoring code changes.

import { LocalStorageStorage } from '@core/services/storage';
import { ProgressService } from '@core/services/progress';
import { AudioService } from '@core/services/audio';
import { ContentService } from '@core/services/content';
import { SrsService } from '@core/services/srs';
import { FlashcardSessionService, DEEP_REVIEW_DECK_KEY } from '@core/services/flashcard-session';
import { FehlerbuchService } from '@core/services/fehlerbuch';

import.meta.env.BASE_URL;

const storage  = new LocalStorageStorage();
const progress = new ProgressService(storage);
const audio    = new AudioService(import.meta.env.BASE_URL);
const content  = new ContentService();
const srs             = new SrsService(storage);
const flashcardSession = new FlashcardSessionService(storage, srs);
const fehlerbuch        = new FehlerbuchService(storage, srs);

export { storage, progress, audio, content, srs, flashcardSession, DEEP_REVIEW_DECK_KEY, fehlerbuch };
export type { StorageService }   from '@core/services/storage';
export type { CourseProgress }   from '@core/services/progress';
export type { AudioServiceInterface } from '@core/services/audio';
export type { Rating, CardState } from '@core/services/srs';
export type { FlashcardSession } from '@core/services/flashcard-session';
export type { FehlerbuchEntry } from '@core/engine/fehlerbuch';
export type { ConfusionPair } from '@core/engine/confusion-pairs';
