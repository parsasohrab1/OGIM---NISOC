# Article submission content

Branch `article-submission-content` holds the material for the article planned for this product. The product code on the default branch is unchanged.

| Item | Value |
|------|-------|
| Target venue | Petroleum Science (KeAi) |
| Type | journal |
| Deadline | rolling – پذیرش مداوم |
| Official page | https://www.keaipublishing.com/en/journals/petroleum-science/news/petroleum-science-latest-impact-factor-announced-61/ |
| Abstract rule (Elsevier / KeAi journal) | Single unstructured paragraph, no references, no undefined abbreviations; state objective, method, main results and conclusion. Typical length 150–250 words; keywords 4–6. |

## Title
An Edge-to-Dashboard Framework for Anomaly Detection and Production Forecasting in Oil and Gas Fields

## Abstract (draft)
Operators of mature oil and gas fields need to detect abnormal well and facility behaviour early, yet supervisory systems mostly raise fixed-threshold alarms that are either missed or ignored. This paper describes an intelligent field-monitoring framework that connects to SCADA through the OPC-UA and MQTT protocols and applies time-series analysis to wellhead pressure, temperature and production data. The framework combines unsupervised anomaly detection with short-horizon production forecasting and presents the results on a web dashboard that prioritises wells by deviation from expected behaviour. A demonstration deployment was set up on [number] wells of [field name] operated by [operator]. Over [period], the anomaly detector flagged [N] events, of which [M] were confirmed by field engineers, giving a precision of [X] and a recall of [Y] against the operator's alarm log. Production forecasts reached a mean absolute percentage error of [Z] at a [horizon] horizon, compared with [W] for [baseline]. The framework reduced the time needed to locate the cause of a deviation from [A] to [B] in the engineers' assessment. These findings show that a protocol-based, containerised monitoring layer can be added to existing field automation to support daily surveillance decisions, and they identify data quality at the wellhead as the main limit on accuracy.

**Keywords:** oil and gas fields; anomaly detection; production forecasting; SCADA; OPC-UA; field surveillance

## Before submitting
1. Replace every `[bracketed]` placeholder with values measured by the team on real data; no number in the draft is a result.
2. Add author names and affiliations; confirm the abstract limits in the venue's author guidelines (the limits above are typical for the venue family).
3. Add the experiment scripts and data description used for the results to this branch.
4. The Word file for the submission system is prepared in the platform repository (`outputs/abstracts/`).
