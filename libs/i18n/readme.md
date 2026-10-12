# Nest i18n helpers

Small helpers on top of [`nestjs-i18n`](https://nestjs-i18n.com) for validation messages that are translated later, at the exception handling step.

- `I18nMessage()` - `message` option for `class-validator` decorators, which defers the translation and lets `translateI18MessageErrors` derive the translation key from the failed constraint. Pass a key to use a custom message.
- `I18nDefer(key, args)` - wraps a translation key and its arguments in a string that can be translated later (`I18nDefer.isTranslatable`, `I18nDefer.unwrap`).
- `translateI18MessageErrors(context, errors, constraintsPrefix)` - replaces the deferred constraint messages of validation errors with translation keys.

## Install

```shell
npm install @jchpro/nest-i18n nestjs-i18n class-validator
```
