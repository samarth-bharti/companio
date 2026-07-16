-- Store the portrait, and the blurred copy of it we generate ourselves.
--
-- WHY
--
-- A pass buys the right to see a companion's face, so a locked card must
-- withhold that face. The old answer appended `?blur=400` to an Unsplash URL and
-- let Unsplash do the destroying, which worked only while every portrait was
-- stock imagery of a stranger. For a real companion it failed three ways at
-- once: their photo is not on images.unsplash.com so the parameters did nothing;
-- next/image refused the host and answered 400; and nothing stored the photo
-- anyway, because the applicant's upload was hashed and discarded.
--
-- lib/server/photoStore.ts now blurs the portrait with sharp at ingest and
-- writes both variants to our own blob store. These columns hold the results.
--
-- companion_applications.photoUrl / photoBlurUrl
--   Written by /api/application/upload. approveApplication copies them onto the
--   companion row, so an approved profile goes live wearing the applicant's own
--   face instead of waiting for an operator to paste a link.
--
-- companions.photoBlurred
--   The only image a viewer without an active pass is ever sent. Nullable
--   because rows predating the pipeline have no blurred variant; redactCompanion
--   serves '' for those, so a portrait we cannot destroy is one we never send.
--
-- The ID DOCUMENT is deliberately not stored, here or anywhere: only idHash and
-- idDocMasked. A portrait is published by design; an Aadhaar image is a DPDPA
-- liability with no reason to exist once its number has been checked.
--
-- Every column is additive and nullable. No existing row changes.

ALTER TABLE "companion_applications" ADD COLUMN "photoUrl" TEXT;
ALTER TABLE "companion_applications" ADD COLUMN "photoBlurUrl" TEXT;

ALTER TABLE "companions" ADD COLUMN "photoBlurred" TEXT;
