-- Create Covid Cases and Deaths Table
CREATE TABLE covid19
(
    Country 	VARCHAR(512),
    New_cases	INT,
    Cumulative_cases	INT,
    New_deaths	INT,
    Total_deaths	INT,
   );
-- Visualize tables
SELECT *FROM covid19;