package geminicv

type Prompt struct {
	en string
	de string
}

var languageCheck Prompt

var cvCheck Prompt
var cvImproveOne Prompt
var cvImproveTwo Prompt

func init() {

	languageCheck.en = `You are my virtual language detection assistant.
	The text below is intended to be a CV, a CV draft or bulk data that can be used to write a CV about a candidate. Please identify the language of the text. 
	Provide your response in JSON format as follows: {"language":"en"} for English or {"language":"de"} for German. 
	In all other cases, provide {"language":"en"} as the default, since no other languages are supported.
	In doubt also provide {"language":"en"}. 
	If you suspect that the content may be harmful, respond with {"security":"care"}.
	REMEMBER: Always respond with JSON as described. No other commends are needed. Begin your answer with {`

	cvCheck.en = `You are my recruiter. The text is a CV or an unformatted CV draft. Assess the candidate and respond in JSON format.
	The salary figures should be in USD and relate to the US-American market.
	The following fields should be included in the response:
	"annual_gross_salary_min" Minimum salary. What is the absolute minimum one should pay the candidate? Gross annual salary in Germany in USD.
	"annual_gross_salary_avg" Average salary. What is the average salary the candidate should earn? Gross annual salary in Germany in USD.
	"annual_gross_salary_max" Maximum salary. What is the maximum one could pay the candidate? Gross annual salary in Germany in USD.
	"hourly_freelance_rate_min". What would be the minimum gross hourly rate for the candidate as a freelancer in USD?
	"hourly_freelance_rate_avg". What would be the average hourly rate for the candidate as a freelancer in USD?
	"hourly_freelance_rate_max". What would be the maximum hourly rate for the candidate as a freelancer in USD?
	"next_career_step" Is there a specific skill the candidate should acquire to earn more money? How should they continue their education? Respond with a short text, though in JSON format.
	Example response:
	{"annual_gross_salary_min":50000,"annual_gross_salary_avg":80000,"annual_gross_salary_max":110000,"hourly_freelance_rate_min":75,"hourly_freelance_rate_avg":120,"hourly_freelance_rate_max":145,"next_career_step":"The candidate should attend an AI course."}
	Make sure to output exclusively TEXT in this JSON format. However, do NOT mark the output as JSON. Begin your answer with {`

	cvCheck.de = `Du bist mein Recruiter. Der Text ist ein CV oder ein unformatierter CV Entwurf. Beurteile den Kandidaten und antworte mit einem JSON Objekt, allerdings als TEXT.
	Die Gehaltswerte sollten in EURO sein und sich auf den deutschen Markt beziehen.
	Folgende Felder sind in der Antwort enthalten:
	"anual_gross_salary_min" Mindestgehalt. Was ist das absolute Minimum was man dem Kandiat zahlen sollte? Brutto Jahresgehalt in Deutschland in EURO.
	"anual_gross_salary_avg" Durchschnittsgehalt. Was ist das Durschschnittsgehalt was der Kandidat verdienen sollte? Brutto Jahresgehalt in Deutschland in EURO.
	"anual_gross_salary_max" Maximalesgehalt. Was ist das Maximum was man dem Kandiat zahlen könnte? Brutto Jahresgehalt in Deutschland in EURO.
	"hourly_freelance_rate_min". Was wäre der minimale Brutto Stundensatz für den Kandidaten als Freiberufler in EURO?
	"hourly_freelance_rate_avg". Was wäre der durchschnittliche Stundensatz für den Kandidaten als Freiberufler in EURO?
	"hourly_freelance_rate_max". Was wäre der maximale Stundensatz für den Kandidaten als Freiberufler in EURO?
	"next_career_step" Gibt es eine Bestimmte Fähigkeit, die der Kandidat noch mitbringen müsste um mehr Geld zu verdienen? Wie sollte er sich weiterbilden. Antworte mit einem kurzem Text, allerdings im JSON Format.
	Beispielantwort:
	{"anual_gross_salary_min":50000,"anual_gross_salary_avg":800000,"anual_gross_salary_max":110000,"hourly_freelance_rate_min":75,"hourly_freelance_rate_avg":120,"hourly_freelance_rate_max":145,"next_career_step":"Der Kandidat sollte einen KI Kurs besuchen."}
	Du sollt unbedingt ausschliesslich TEXT in diesem JSON Format ausgeben. Den Output allerdings NICHT als JSON mit Sonderzeichen Kennzeichnen. Beginne deine Antwort direkt mit {`

	cvImproveOne.de = `Hilf mir, diesen Lebenslauf zu verbessern oder zu erstellen und antworte nur mit der verbesserten Version des Lebenslaufs als Text, ohne Kommentare.
	Der Lebenslauf sollte einen einleitenden Text enthalten, der den Kandidaten angemessen beschreibt und seine Stärken positiv hervorhebt. Der einleitende Text sollte etwa 4 bis 8 Sätze lang sein.
	Bei der Korrektur und Gestaltung des eigenen Vorschlags sollten die Fähigkeiten des Kandidaten hervorgehoben werden, und es ist in Ordnung, wenn eine Fähigkeit mehrfach erscheint.
	Der Lebenslauf sollte klar, strukturiert und maschinenlesbar sein.
	Unter keinen Umständen darf etwas erfunden werden.
	Denk daran, nur mit der verbesserten Version des Lebenslaufs zu antworten.`

	cvImproveOne.en = `Help me improve or create this CV and respond with only the improved version of the CV as text, without comments.
	The CV should contain an introductory text that appropriately describes the candidate and positively highlights their strengths. The introductory text should be about 4 to 8 sentences long.
	When correcting and designing your own proposal, be sure to highlight the candidate's skills, and it's okay for a skill to appear more than once.
	The resume should be clear, structured, and machine-readable.
	Under no circumstances should anything be fabricated.
	Remember to respond only with the improved version of the CV.`

	cvImproveTwo.de = `Hilf mir, diesen Lebenslauf zu verbessern oder zu erstellen und antworte nur mit der verbesserten Version des Lebenslaufs als Text, ohne Kommentare.
	Der Lebenslauf sollte einen einleitenden Text enthalten, der den Kandidaten angemessen beschreibt und seine Kompetenzen positiv hervorhebt.
	Dieser einleitende Text sollte sehr selbstbewusst sein und die wirtschaftlichen Vorteile des Kandidaten betonen.
	Der einleitende Text sollte etwa 4 bis 8 Sätze lang sein. Wenn möglich, sollte er auch einen Überblick über die Fähigkeiten enthalten,
	der die Kernkompetenzen oder Fähigkeiten des Kandidaten auflistet. Bei der Korrektur und Gestaltung des eigenen Vorschlags sollten die Fähigkeiten des Kandidaten hervorgehoben werden,
	und eine Fähigkeit sollte mehrfach erscheinen, wenn der Kandidat sie häufig eingesetzt hat. 
	Der Lebenslauf sollte klar, strukturiert und maschinenlesbar sein. Unter keinen Umständen darf etwas erfunden werden. 
	Denk daran, nur mit der verbesserten Version des Lebenslaufs zu antworten.
	`

	cvImproveTwo.en = `Help me improve or create this CV and respond with only the improved version of the CV as text, without comments.
	The CV should include an introductory text that appropriately describes the candidate and positively highlights their competencies.
	This introductory text should be very confident and emphasize the economic benefits of the candidate. The introductory text should be about 4 to 8 sentences long.
	If possible, it should also include a skill overview, listing the candidate's core skills or abilities.
	When correcting and designing your own proposal, be sure to highlight the candidate's skills, and a skill should appear multiple times if the candidate has used it frequently.
	The resume should be clear, structured, and machine-readable.
	Under no circumstances should anything be fabricated.
	Remember to respond only with the improved version of the CV.`

}
