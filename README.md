[![Build Status](https://travis-ci.org/urbanriskmap/cognicity-sensors-etl-us.svg?branch=dev)](https://travis-ci.org/urbanriskmap/cognicity-sensors-etl-us) [![Coverage Status](https://coveralls.io/repos/github/urbanriskmap/cognicity-sensors-etl-us/badge.svg?branch=dev)](https://coveralls.io/github/urbanriskmap/cognicity-sensors-etl-us?branch=dev)

# Cognicity Sensors ETL Repository

This repository contains ETL (Extract, Transform, Load) functions for collecting and processing sensor data from various sources, including the US Geological Survey (USGS) and South Florida Water Management District (SFWMD). The functions are deployed as AWS Lambda functions, triggered on scheduled intervals to gather and process real-time data from these sensors.

## Table of Contents
- [Introduction](#introduction)
- [Lambda Functions](#lambda-functions)
  - [USGS Sensor ETL Functions](#usgs-sensor-etl-functions)
  - [USGS Sensor Data ETL Functions](#usgs-sensor-data-etl-functions)
  - [SFWMD ETL Functions](#sfwmd-etl-functions)
- [Project Structure](#project-structure)
- [ETL Process Overview](#etl-process-overview)
- [Functions Breakdown](#functions-breakdown)
  - [ETL Sensors](#etl-sensors)
    - [Example SFWMD Sensors](#example-sfwmd-sensors)
  - [ETL Data](#etl-data)
    - [Example SFWMD Aggregated Data](#example-sfwmd-aggregated-data)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

## Introduction
This project consists of multiple AWS Lambda functions that extract sensor data from USGS and SFWMD. Each function is triggered by a scheduled CRON job, defined in the `serverless.yml` configuration file, allowing for periodic data extraction, processing, and storage. The functions are individually packaged to optimize deployment efficiency.

## Lambda Functions

### USGS Sensor ETL Functions
These functions extract data from various USGS sensors at defined intervals:
- **etlGroundwaterSensor**: Collects groundwater sensor data.
- **etlGaugeHeightSensor**: Gathers gauge height sensor data.
- **etlDischargeRateSensor**: Retrieves discharge rate sensor data.
- **etlStreamElevationSensor**: Fetches stream elevation sensor data.
- **etlPrecipitationSensor**: Acquires precipitation sensor data.

### USGS Sensor Data ETL Functions
These functions process and load the data collected from the USGS sensors:
- **etlGroundwaterData**
- **etlGaugeHeightData**
- **etlDischargeRateData**
- **etlStreamElevationData**
- **etlPrecipitationData**

### SFWMD ETL Functions
- **wmdUploadStations**: Uploads SFWMD station data.
- **etlWmdTimeseriesData**: Extracts time series data from SFWMD.
- **etlWmdAggregateData**: Processes and aggregates daily mean data.

## Project Structure
The project is organized into the following directories, which includes utilities, services, and ETL (Extract, Transform, Load) functions for handling data from various sources:

```
src/
 ├── library/
 │   └── data/                # Utilities handling data operations
 ├── services/                # Http request methods
 └── functions/
     ├── etl-data/
     │   ├── sfwmd/
     │   │   ├── aggregate/   # ETL for aggregated data
     │   │   └── timeseries/  # ETL for time series data
     │   └── usgs/            # ETL for USGS data
     └── etl-sensors/
         ├── sfwmd/           # ETL for SFWMD sensors
         └── usgs/            # ETL for USGS sensors
```

## ETL Process Overview

The ETL process for sensors and data consists of the following steps:

1. **Extract**: Retrieve sensor metadata and data from SFWMD and USGS APIs.
2. **Transform**: Process, filter, and structure the data for the target database.
3. **Load**: Push the transformed data into the database or other storage solutions.

### Flow Overview:
- **Sensor ETL**: Fetches existing stations (sensors) from the storage system, compares them against incoming data, and uploads new or updated stations.
- **Data ETL**: Aggregates or retrieves timeseries observations for these stations, transforms the data into the required format, and stores it in the system.

## Functions Breakdown

### ETL Sensors

The ETL sensors functions manage the metadata associated with water monitoring stations (sensors). These functions ensure the correct handling and update of sensor metadata in the system.

#### Example SFWMD Sensors

- **File**: `etl-sensors/sfwmd/model.js`  
  This file defines the logic for handling SFWMD sensor stations, specifically for extracting, comparing, and loading station metadata.

  **Methods**:
  - `getExistingStations()`: Retrieves existing sensor stations from the storage.
  - `compareStations()`: Compares incoming stations with the existing ones to check for duplicates.
  - `loadStation()`: Uploads new stations to the storage if they don’t already exist.

- **File**: `etl-sensors/sfwmd/index.js`  
  The entry point for processing SFWMD stations, which calls the methods from the `UploadStations` class to handle the stations in a batch.

  **Process**:
  1. Fetches existing stations.
  2. Compares new station data to avoid duplicates.
  3. Uploads new stations.

### ETL Data

The ETL data functions manage the timeseries and aggregate data collected from the sensors. These functions are responsible for pulling raw data, transforming it, and pushing it to the database.

#### Example SFWMD Aggregated Data

- **File**: `etl-data/sfwmd/aggregate/model.js`  
  This file handles the process of fetching aggregated data from SFWMD sensors, transforming the data, and loading it into the system.

  **Methods**:
  - `filterStations()`: Filters stations based on specific properties (e.g., stationId).
  - `checkStoredObservations()`: Checks if there are any stored observations for the station.
  - `extractStationObservations()`: Extracts the latest sensor observations from the external API.
  - `transform()`: Transforms the raw observation data into the required structure.
  - `compareStationObservations()`: Compares extracted observations with existing ones.
  - `loadObservations()`: Loads the new or updated observations into the database.

- **File**: `etl-data/sfwmd/aggregate/index.js`  
  The entry point for processing SFWMD aggregated data. It coordinates the ETL process, calling various methods to extract, transform, and load data.

  **Process**:
  1. Filters active stations.
  2. Extracts observations.
  3. Transforms and compares the new observations with the existing data.
  4. Loads the updated observations into the system.

### Environment Variables

#### .env (for testing a single function during development)

The `.env` file is used during development for testing individual functions. It includes basic parameters such as API keys and sensor settings.

```
API_KEY= # The key required to authenticate requests during development.
SERVER_ENDPOINT= # The URL for the server endpoint you're interacting with.
SENSOR_CODE= # A 5-digit code representing the USGS sensor being used.
HAS_UPSTREAM_DOWNSTREAM= # Boolean indicating whether upstream and downstream data is included.
RECORDS_PERIOD= # The time period for which records are fetched, e.g., 1 day (P1D).
RECORDS_INTERVAL= # The interval between each record fetch, e.g., 15 minutes (PT15M).
```

#### .env.yml (for defining project and deployment parameters)

The `.env.yml` file is used for defining project-specific parameters and deployment environment settings. This is where you specify AWS regions, area tags, API keys for different environments, and API endpoints.

```
region: # The AWS region where resources are deployed.
areatag: # An optional tag to identify or categorize specific areas.
dev-apikey: # The API key or secret for the development environment.
prod-apikey: # The API key or secret for the production environment.
dev-serverEndPoint: # The URL of the API gateway endpoint in the development environment.
prod-serverEndPoint: # The URL of the API gateway endpoint in the production environment.
```

## Deployment
The deployment process for this repository involves creating multiple AWS Lambda functions, each with its own CRON schedule as defined in the `serverless.yml` file. The deployment is managed using the AWS CLI and the Serverless Framework. Each function is packaged individually for efficient deployment and versioning.

Steps to deploy:
1. Install the Serverless Framework and AWS CLI if not already installed.
2. Install Node packages:
   ```bash
   npm install
   ```
3. Ensure that the necessary AWS credentials are configured using the `serverless` profile, or in `~/.aws/credentials`.
4. Run the following command to deploy all the Lambda functions defined in the `serverless.yml` file:
   ```bash
   sls deploy --stage <stage-name>
   ```
   Or
   ```bash
   npm deploy-dev
   ```
6. The Lambda functions will be deployed, and their CRON schedules will be set according to the intervals specified in `serverless.yml` (e.g., every 12 hours, 15 minutes, etc.).

Each function will be triggered automatically based on its schedule without manual intervention, ensuring timely extraction and processing of sensor data from the USGS and SFWMD systems.
