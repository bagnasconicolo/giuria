# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains event data from the University of Turin's "La Strada delle Scoperte" program, exported as CSV format. The data includes event schedules with dates, times, locations, titles, and department information.

## Repository Structure

- `la_strada_delle_scoperte_events.csv` - Event data with columns: date, day, time, location, title, department
- Event data covers October 2025 events across multiple departments (DST, DSTF, Fisica, Chimica)

## Data Format

The CSV file contains structured event information:
- **date**: ISO format (YYYY-MM-DD)
- **day**: Italian day name (lunedì, martedì, mercoledì, giovedì, venerdì)
- **time**: Time range (e.g., "14:00–14:30") or time period (e.g., "mattino", "pomeriggio")
- **location**: Event venue, typically addresses along via Pietro Giuria
- **title**: Event title/description
- **department**: Department code (DST, DSTF, Fisica, Chimica)
