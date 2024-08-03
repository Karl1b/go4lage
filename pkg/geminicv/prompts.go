package geminicv

type Prompt struct {
	en string
	de string
}

var cvCheck Prompt
var cvImproveOne Prompt
var cvImproveTwo Prompt

func init() {

	cvCheck.en = `You are my recruiter. The text is a CV or an unformatted CV draft. Assess the candidate and respond in JSON format.
	The salary figures should be in USD and relate to the US-American market.
	Take your time to check the details and information carefully and critically.
	The following fields should be included in the response:
	"anual_gross_salary_min" Minimum salary. What is the realistic minimum salary the candidate could be negotiated down to? Gross anual salary in the US in USD.
	"anual_gross_salary_avg" Average salary. What is the average salary the candidate should earn? Gross anual salary in the US in USD.
	"hourly_freelance_rate_min". What would be the minimum realistic gross hourly rate for the candidate as a freelancer in the US market USD?
	"hourly_freelance_rate_avg". What would be the average hourly rate for the candidate as a freelancer in the US market USD?
	You should only answer with JSON. START your answer with {
	Example response:
	{"anual_gross_salary_min":50000,"anual_gross_salary_avg":80000,"hourly_freelance_rate_min":75,"hourly_freelance_rate_avg":120}`

	cvCheck.de = `Du bist mein Recruiter. Der Text ist ein Lebenslauf oder ein unformatierter Lebenslaufentwurf. Bewerte den Bewerber und antworte im JSON-Format.
	Die Gehaltsangaben sollten in EURO sein und sich auf den deutschen Markt beziehen.
	Nimm dir Zeit die Angaben und die Informationen genaum, sorgfältig und kritisch zu überprüfen.

	„anual_gross_salary_min“ Mindestgehalt. Wie hoch ist das Mindestgehalt, auf das der Bewerber realistich, aber kritisch, herunterverhandelt werden könnte? Bruttojahresgehalt in Deutschland in EURO?
	„anual_gross_salary_avg“ Durchschnittsgehalt. Wie hoch ist das Durchschnittsgehalt, das der Kandidat verdienen sollte? Bruttojahresgehalt in Deutschland in EURO?
	„stundenlohn_freelance_rate_min“. Wie hoch wäre der realistiche, kritische Mindestbruttostundensatz, für den Kandidaten als Freiberufler auf dem deutschem Markt runterverhandelt werden könnte, in EURO?
	„Stundensatz_freelance_rate_avg“. Wie hoch wäre der realistiche durchschnittliche Stundensatz des Bewerbers als Freiberufler auf dem deutschem Markt in EURO?
	Anworte nur mit JSON. Beginne deine Antwort mit {
	Beispiel-Antwort:
	{„anual_gross_salary_min“:50000,„anual_gross_salary_avg“:80000,„hourly_freelance_rate_min“:75,„hourly_freelance_rate_avg“:120}`

	cvImproveOne.de = `Hilf mir, diesen Lebenslauf zu verbessern oder zu erstellen und antworte nur mit der verbesserten Version des Lebenslaufs als Text, ohne Kommentare.
	Der Lebenslauf sollte einen einleitenden Text enthalten, der den Kandidaten angemessen beschreibt und seine Stärken positiv hervorhebt. Der einleitende Text sollte etwa 5 bis 9 Sätze lang sein.
	Bei der Korrektur und Gestaltung des eigenen Vorschlags sollten die Fähigkeiten des Kandidaten hervorgehoben werden, und es ist in Ordnung, wenn eine Fähigkeit mehrfach erscheint.
	Der Lebenslauf sollte klar, strukturiert und maschinenlesbar sein.
	Unter keinen Umständen darf etwas erfunden werden.
	Denk daran, nur mit der verbesserten Version des Lebenslaufs zu antworten.`

	cvImproveOne.en = `Help me improve or create this CV and respond with only the improved version of the CV as text, without comments.
	The CV should contain an introductory text that appropriately describes the candidate and positively highlights their strengths. The introductory text should be about 5 to 9 sentences long.
	When correcting and designing your own proposal, be sure to highlight the candidate's skills, and it's okay for a skill to appear more than once.
	The resume should be clear, structured, and machine-readable.
	Under no circumstances should anything be fabricated.
	Remember to respond only with the improved version of the CV.`

	cvImproveTwo.de = `Hilf mir, diesen Lebenslauf zu verbessern oder zu erstellen und antworte nur mit der verbesserten Version des Lebenslaufs als Text, ohne Kommentare.
	Der Lebenslauf sollte einen einleitenden Text enthalten, der den Kandidaten angemessen beschreibt und seine Kompetenzen positiv hervorhebt.
	Dieser einleitende Text sollte sehr selbstbewusst sein und die wirtschaftlichen Vorteile des Kandidaten betonen.
	Der einleitende Text sollte etwa 5 bis 9 Sätze lang sein. Wenn möglich, sollte er auch einen Überblick über die Fähigkeiten enthalten,
	der die Kernkompetenzen oder Fähigkeiten des Kandidaten auflistet. Bei der Korrektur und Gestaltung des eigenen Vorschlags sollten die Fähigkeiten des Kandidaten hervorgehoben werden,
	und eine Fähigkeit sollte mehrfach erscheinen, wenn der Kandidat sie häufig eingesetzt hat. 
	Der Lebenslauf sollte klar, strukturiert und maschinenlesbar sein. Unter keinen Umständen darf etwas erfunden werden. 
	Denk daran, nur mit der verbesserten Version des Lebenslaufs zu antworten.
	`
	cvImproveTwo.en = `Help me improve or create this CV and respond with only the improved version of the CV as text, without comments.
	The CV should include an introductory text that appropriately describes the candidate and positively highlights their competencies.
	This introductory text should be very confident and emphasize the economic benefits of the candidate. The introductory text should be about 5 to 9 sentences long.
	If possible, it should also include a skill overview, listing the candidate's core skills or abilities.
	When correcting and designing your own proposal, be sure to highlight the candidate's skills, and a skill should appear multiple times if the candidate has used it frequently.
	The resume should be clear, structured, and machine-readable.
	Under no circumstances should anything be fabricated.
	Remember to respond only with the improved version of the CV.`

}
