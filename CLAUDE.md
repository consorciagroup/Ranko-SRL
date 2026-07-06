@AGENTS.md

# Flujo de trabajo con git — Ranko SRL

Este flujo se sigue cada vez que el usuario pide arrancar una feature, fix o
refactor nuevo. No se dispara automáticamente al iniciar una conversación.

## 1. Actualizar develop
- Verificar que no haya cambios sin commitear (`git status`); si los hay,
  resolverlos (commit o stash) antes de cambiar de rama.
- `git fetch origin`
- `git checkout develop`
- `git pull origin develop`

## 2. Crear la branch de trabajo
Desde develop ya actualizado, crear una branch con prefijo según el tipo de
cambio:
- `feature/<slug>` — funcionalidad nueva
- `fix/<slug>` — corrección de un bug
- `refactor/<slug>` — refactor sin cambio de comportamiento

`<slug>` en minúsculas, con guiones medios (ej: `feature/checklist-matafuegos`).

## 3. Gate antes de mergear
Con los cambios implementados, correr y confirmar que pasen los tres:
- `npm test`
- `npm run lint`
- `npm run build`

Si algo falla, arreglarlo antes de seguir — nunca mergear con el gate roto.

## 4. Merge a develop
Con el gate en verde:
- `git checkout develop`
- `git merge --no-ff <branch>` (conserva el historial de la feature, igual
  que los merges existentes del repo)
- Confirmar con el usuario antes de `git push origin develop`, porque es una
  rama compartida por todo el equipo.

## 5. main queda fuera de este flujo
La promoción de develop a main la maneja el equipo manualmente vía PR en
GitHub, y requiere la aprobación de todos los integrantes. Claude no abre
PRs ni mergea contra main.
