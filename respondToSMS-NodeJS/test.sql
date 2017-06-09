
DECLARE @a nvarchar(max) = '[{"id":"SITZP00427145","violation":"AS11.56.757(a)","description":" Violate Condition Of Release","location":"SIT"}]'
    
SELECT *
FROM OPENJSON((select top 1 citations from cases), '$' ) 
WITH (ID NVARCHAR(25) '$.id', Violation NVARCHAR(25) '$.violation');

SELECT JSON_QUERY(citations, '$')
FROM cases

SELECT JSON_VALUE(citations, '$[0].id') AS ID,  JSON_VALUE(citations, '$[0].violation') AS VIOLATION
from cases