# how to use download-raw-operator-data.mjs:

1. cd src/constants/operatorConstants/01_scripts <!-- (or the directory where .mjs file located, if the location changed) -->
2. run node download-raw-operator-data.mjs

```
cd src/constants/operatorConstants/01_scripts
node download-raw-operator-data.mjs
```

2. for overwrite existing data

```
node download-raw-operator-data.mjs --force
```

2. for additional json structure check

```
node download-raw-operator-data.mjs --json-check
```

## what it's do:

1. download .json file listed in src/constants/operatorConstants/01_scripts/raw-operator-list.md from BASE_URL ("https://endfieldtools.dev/localdb/optimized/characters/details")
2. with constrains:

- hardcoded pattern id "chr_0000_name"
- max 30items downloaded
- max 1MiB file size
- 10s wait until request timeout
- valid json structure if using --json-check

## note:

i'm using node v20.19.0, i think you need node v18+ to run api call fetch function

# how to use transform-attributes.mjs

1. run localhost jolt service
2. cd src/constants/operatorConstants/01_scripts
3. run node transform-attributes.mjs

## what it's do:

1. turn raw .json into more readable (i hope so), and only extract the data needed for damage calculation

## limitation:

jolt library use java, if there's something simpler feel free to replace

## note:

- i'll extract skill.json next (maybe)
- i'll extract potential and trust after that
