# Chrome Extension for Academic Research on SEB Validation Flows in Moodle

> **Private academic project**
>
> This repository contains an experimental browser extension created **exclusively for academic and controlled research purposes**, focused on studying validation flows, trust assumptions, and defensive limitations in Moodle quiz environments that rely on Safe Exam Browser-style checks.
>
> This project **must not** be used in real exams, production systems, or any environment without authorization.

## Overview

This project is a **Chrome extension** created as a **proof-of-concept research artifact** to demonstrate, in a practical way, the fragility of **SEB (Safe Exam Browser)**. The goal is to show that the tool sells a sense of security that does not hold up in practice: besides being relatively easy to bypass, it ends up doing much more to **make life harder for honest students** than to prevent real cheating.

In the end, rather than solving the cheating problem, SEB often merely adds **more friction, more limitations, and more headaches** for those who are already trying to complete the assessment properly.

## Academic Purpose

The main academic value of this repository lies in demonstrating, in an objective and practical way, that many of the controls imposed by **SEB** can be bypassed extremely easily, sometimes with only a few lines of code.

The purpose of this proof of concept is to highlight the structural issue that **SEB does not have a truly reliable mechanism to guarantee** that it is actually installed, running, and being effectively used by the student during the activity. In practice, this allows a regular browser, such as **Chrome**, to present itself to Moodle as if it were SEB, and the result is concerning. Moodle receives this information, accepts it, and proceeds normally, without robust validation of the environment’s authenticity.

From this perspective, this repository seeks to contribute to the academic and technical debate on the limits of this protection model, showing that the apparent security offered by the tool may be far more superficial than effective.

## Prompt Used to Create the Plugin

The plugin was developed with support from **Google Gemini**, based on a prompt aimed at building a **proof of concept for academic research**:

```
Create a Chrome plugin, intended for academic research, that modifies Chrome's `User-Agent` to `SEB/3.6.1` and removes the `sec-ch-ua` header so that Moodle believes it is communicating with SEB rather than Chrome.

The plugin may only run when the URL contains `mod/quiz`, and on that page it must:
* First load the config from `[WWWROOT]/mod/quiz/accessrule/seb/config.php?cmid=$cmid` and store the key in storage to add it to the headers.
* Change the `User-Agent` to a valid `SEB/3.6.1`
* Add the headers: "X-SafeExamBrowser-RequestHash" based on the public SEB configuration documents
* Add the headers: "X-SafeExamBrowser-ConfigKeyHash" based on the public SEB configuration documents
```
