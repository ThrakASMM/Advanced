document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('start-game').addEventListener('click', startGame);
    document.getElementById('back-to-menu').addEventListener('click', backToMenu);
    document.getElementById('restart-test').addEventListener('click', restartTest);
    document.getElementById('next-question').addEventListener('click', skipQuestion);

    const notes = {};
    const noteMap = {
        'C': 0, 'Db': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'Gb': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11
    };
    const reverseNoteMap = Object.keys(noteMap).reduce((acc, key) => {
        acc[noteMap[key]] = key;
        return acc;
    }, {});
    const enharmonicMap = {
        'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
    };
    const fourSoundsStructures = [
        { type: 'Maj7', intervals: [4, 3, 4], inversion: 'PF' },
        { type: 'Min7', intervals: [3, 4, 3], inversion: 'PF' },
        { type: '7', intervals: [4, 3, 3], inversion: 'PF' },
        { type: '-7b5', intervals: [3, 3, 4], inversion: 'PF' },
        { type: 'TBN 1', intervals: [2, 4, 3], inversion: 'PF' },


        { type: 'Maj7', intervals: [3, 4, 1], inversion: 'R1' },
        { type: 'Min7', intervals: [4, 3, 2], inversion: 'R1' },
        { type: '7', intervals: [3, 3, 2], inversion: 'R1' },
        { type: '-7b5', intervals: [3, 4, 2], inversion: 'R1' },

        { type: 'Maj7', intervals: [4, 1, 4], inversion: 'R2' },
        { type: 'Min7', intervals: [3, 2, 3], inversion: 'R2' },
        { type: '7', intervals: [3, 2, 4], inversion: 'R2' },
        { type: '-7b5', intervals: [4, 2, 3], inversion: 'R2' },


        { type: 'Maj7', intervals: [1, 4, 3], inversion: 'R3' },
        { type: 'Min7', intervals: [2, 3, 4], inversion: 'R3' },
        { type: '7', intervals: [2, 4, 3], inversion: 'R3' },
        { type: '-7b5', intervals: [2, 3, 3], inversion: 'R3' },
    
        // Maj7 D2 inversions
        { type: 'Maj7 D2', intervals: [7, 4, 5], inversion: 'PF' },
        { type: 'Maj7 D2', intervals: [7, 1, 7], inversion: 'R1' },
        { type: 'Maj7 D2', intervals: [5, 4, 7], inversion: 'R2' },
        { type: 'Maj7 D2', intervals: [5, 3, 5], inversion: 'R3' },
    
        // Min7 D2 inversions
        { type: 'Min7 D2', intervals: [7, 3, 5], inversion: 'PF' },
        { type: 'Min7 D2', intervals: [7, 2, 7], inversion: 'R1' },
        { type: 'Min7 D2', intervals: [5, 3, 7], inversion: 'R2' },
        { type: 'Min7 D2', intervals: [5, 4, 5], inversion: 'R3' },
    
        // Dim7 and Dim7 D2 (without inversions)
        { type: 'Dim7', intervals: [3, 3, 3], inversion: 'PF' },
        { type: 'Dim7 D2', intervals: [6, 3, 6], inversion: 'PF' },
    
        // 7sus4 inversions
        { type: '7sus4', intervals: [5, 2, 3], inversion: 'PF' },
        { type: '7sus4', intervals: [2, 3, 2], inversion: 'R1' },
        { type: '7sus4', intervals: [3, 2, 5], inversion: 'R2' },
        { type: '7sus4', intervals: [2, 5, 2], inversion: 'R3' },
    
        // 7sus4 D2 inversions
        { type: '7sus4 D2', intervals: [7, 3, 7], inversion: 'PF' },
        { type: '7sus4 D2', intervals: [5, 2, 7], inversion: 'R1' },
        { type: '7sus4 D2', intervals: [5, 5, 5], inversion: 'R2' },
        { type: '7sus4 D2', intervals: [7, 2, 5], inversion: 'R3' },

        // 7 D2 inversions
        { type: '7 D2', intervals: [7, 3, 6], inversion: 'PF' },
        { type: '7 D2', intervals: [6, 2, 7], inversion: 'R1' },
        { type: '7 D2', intervals: [5, 4, 6], inversion: 'R2' },
        { type: '7 D2', intervals: [6, 3, 5], inversion: 'R3' },

        // -7b5 D2 inversions
        { type: '-7b5 D2', intervals: [6, 4, 5], inversion: 'PF' },
        { type: '-7b5 D2', intervals: [7, 2, 6], inversion: 'R1' },
        { type: '-7b5 D2', intervals: [6, 3, 7], inversion: 'R2' },
        { type: '7 D2', intervals: [5, 3, 6], inversion: 'R3' },

        // TBN 1 D2 inversions
        { type: 'TBN 1 D2', intervals: [6, 3, 5], inversion: 'PF' },


    ];
    
    const triads = [
        { name: 'Major 7', label: 'Maj7' },
        { name: 'Minor 7', label: 'Min7' },
        { name: '7sus4', label: '7sus4' },
        { name: 'Diminished 7', label: 'Dim7' },
        { name: '7', label: '7' },
        { name: '-7b5', label: '-7b5' },
        { name: 'TBN 1', label: 'TBN 1' },



        { name: 'Major 7 D2', label: 'Maj7 D2' },
        { name: 'Minor 7 D2', label: 'Min7 D2' },
        { name: '7sus4 D2', label: '7sus4 D2' },
        { name: 'Diminished 7 D2', label: 'Dim7 D2' },
        { name: '7 D2', label: '7 D2' },
        { name: '-7b5 D2', label: '-7b5 D2' },
        { name: 'TBN 1 D2', label: 'TBN 1 D2' },
   ];
    
    const inversions = ['Root Position', 'First Inversion', 'Second Inversion', 'Third Inversion'];
    
    for (let octave = 2; octave <= 5; octave++) {
        Object.keys(noteMap).forEach(note => {
            notes[`${note}${octave}`] = `audio/${note}${octave}.mp3`;
        });
    }

    let currentTriad;
    let currentNotes;
    let correctAnswer;
    let questionCount = 0;
    let correctAnswers = 0;
    const totalQuestions = 10;
    let preloadedSounds = {};
    let startTime;
    let endTime;
    let firstNotePlayed;

    function startGame() {
        document.getElementById('menu').style.display = 'none';
        document.getElementById('game').style.display = 'block';
        document.getElementById('back-to-menu').style.display = 'block';
        document.getElementById('restart-test').style.display = 'block';
        document.getElementById('next-question').style.display = 'block';
        questionCount = 0;
        correctAnswers = 0;
        startTime = new Date();
        preloadSounds();
        nextQuestion();
    }

    function preloadSounds() {
        Object.keys(notes).forEach(note => {
            preloadedSounds[note] = new Audio(notes[note]);
            preloadedSounds[note].addEventListener('canplaythrough', () => {
                console.log(`Preloaded sound: ${note}`);
            }, false);
            preloadedSounds[note].addEventListener('error', () => {
                console.error(`Failed to preload sound: ${note}`);
            });
        });
    }

    function stopAllSounds() {
        Object.values(preloadedSounds).forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
    }

    function backToMenu() {
        document.getElementById('game').style.display = 'none';
        document.getElementById('menu').style.display = 'block';
        document.getElementById('back-to-menu').style.display = 'none';
        document.getElementById('restart-test').style.display = 'none';
        document.getElementById('next-question').style.display = 'none';
    }

    function restartTest() {
        document.getElementById('game').style.display = 'none';
        startGame();
    }

    function endGame() {
        endTime = new Date();
        const timeTaken = (endTime - startTime) / 1000;
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = `
            <p>Test terminé !</p>
            <p>Nombre de bonnes réponses : ${correctAnswers} sur ${totalQuestions}</p>
            <p>Temps écoulé : ${timeTaken.toFixed(2)} secondes</p>
        `;
        document.getElementById('back-to-menu').style.display = 'block';
        document.getElementById('restart-test').style.display = 'block';
        document.getElementById('next-question').style.display = 'none';
    }

    function replay() {
        stopAllSounds();
        if (!currentNotes || currentNotes.length === 0) {
            console.error("No notes available to replay.");
            document.getElementById('question').innerText = "Aucune note à rejouer.";
            return;
        }
        document.getElementById('question').innerText = `Note jouée : ${getEnharmonicEquivalent(firstNotePlayed)}`;
        playSingleNoteThenTriad(currentNotes, firstNotePlayed);
    }

    function skipQuestion() {
        questionCount++;
        setTimeout(nextQuestion, 2000);
    }

    function nextQuestion() {
        document.getElementById('validation-message').textContent = '';
        if (questionCount < totalQuestions) {
            document.getElementById('result').textContent = '';
            generateQuestion();
        } else {
            endGame();
        }
    }

    function generateQuestion() {
        const baseNote = getRandomNoteInRange(3, 2);
        const structure = getRandomTriadStructure();
        currentNotes = generate4NotesFromStructure(baseNote, structure);

        const analysis = analyze4Sounds(currentNotes);
        correctAnswer = `${analysis.fundamental}${analysis.triadType}${analysis.inversion}`;

        console.log(`Generated triad: ${currentNotes.join(', ')}`);
        console.log(`Correct Answer: ${correctAnswer}`);

        firstNotePlayed = currentNotes[Math.floor(Math.random() * 4)];
        document.getElementById('question').innerText = `Note jouée : ${getEnharmonicEquivalent(firstNotePlayed)}`;
        
        playSingleNoteThenTriad(currentNotes, firstNotePlayed);
        updateOptions();
    }

    function getRandomTriadStructure() {
        const weightedStructures = [
            ...fourSoundsStructures,
            ...fourSoundsStructures.filter(struct => struct.type.includes('D2')),
            ...fourSoundsStructures.filter(struct => struct.type.includes('D2'))
        ];
        
        return weightedStructures[Math.floor(Math.random() * weightedStructures.length)];
    }

    function generate4NotesFromStructure(baseNote, structure) {
        let noteIndex = noteMap[baseNote.slice(0, -1)];
        let octave = parseInt(baseNote.slice(-1));
        let notes = [baseNote];
        let currentIndex = noteIndex;

        structure.intervals.forEach(interval => {
            currentIndex = (currentIndex + interval) % 12;

            if (currentIndex < noteIndex) {
                octave++;
                if (octave > 5) octave = 5;
            }

            const nextNoteName = reverseNoteMap[currentIndex];
            if (nextNoteName !== undefined) {
                const nextNote = `${nextNoteName}${octave}`;
                notes.push(nextNote);
                noteIndex = currentIndex;
            } else {
                console.error(`Invalid note index: ${currentIndex}`);
            }
        });

        notes.sort((a, b) => {
            const noteValueA = noteMap[a.slice(0, -1)] + parseInt(a.slice(-1)) * 12;
            const noteValueB = noteMap[b.slice(0, -1)] + parseInt(b.slice(-1)) * 12;
            return noteValueA - noteValueB;
        });

        return notes;
    }

    function analyze4Sounds(notes) {
        const [note1, note2, note3, note4] = notes;
        const interval1 = (noteMap[note2.slice(0, -1)] - noteMap[note1.slice(0, -1)] + 12) % 12;
        const interval2 = (noteMap[note3.slice(0, -1)] - noteMap[note2.slice(0, -1)] + 12) % 12;
        const interval3 = (noteMap[note4.slice(0, -1)] - noteMap[note3.slice(0, -1)] + 12) % 12;
    
        let triadType = '';
        let inversion = '';
        let fundamental = note1.slice(0, -1);
    
        // Maj7 PF
        if (interval1 === 4 && interval2 === 3 && interval3 === 4) {
            triadType = 'Maj7';
            inversion = 'PF';
        }
        // Min7 PF
        else if (interval1 === 3 && interval2 === 4 && interval3 === 3) {
            triadType = 'Min7';
            inversion = 'PF';
        }
        // 7 PF
        else if (interval1 === 4 && interval2 === 3 && interval3 === 3) {
            triadType = '7';
            inversion = 'PF';
        }
        // -7b5 PF
        else if (interval1 === 3 && interval2 === 3 && interval3 === 4) {
            triadType = '-7b5';
            inversion = 'PF';

        }
        // Maj7 R1
        else if (interval1 === 3 && interval2 === 4 && interval3 === 1) {
            triadType = 'Maj7';
            inversion = 'R1';
            fundamental = note4.slice(0, -1);
        }
        // Min7 R1
        else if (interval1 === 4 && interval2 === 3 && interval3 === 2) {
            triadType = 'Min7';
            inversion = 'R1';
            fundamental = note4.slice(0, -1);
        }
         // 7 R1
         else if (interval1 === 3 && interval2 === 3 && interval3 === 2) {
            triadType = '7';
            inversion = 'R1';
            fundamental = note4.slice(0, -1);   

         }
         // -7b5 R1
        else if (interval1 === 3 && interval2 === 4 && interval3 === 2) {
            triadType = '-7b5';
            inversion = 'R1';
            fundamental = note4.slice(0, -1); 
        }
        // Maj7 R2
        else if (interval1 === 4 && interval2 === 1 && interval3 === 4) {
            triadType = 'Maj7';
            inversion = 'R2';
            fundamental = note3.slice(0, -1);
        }
        // Min7 R2
        else if (interval1 === 3 && interval2 === 2 && interval3 === 3) {
            triadType = 'Min7';
            inversion = 'R2';
            fundamental = note3.slice(0, -1);
        }
        // 7 R2
        else if (interval1 === 3 && interval2 === 2 && interval3 === 4) {
            triadType = '7';
            inversion = 'R2';
            fundamental = note3.slice(0, -1);
        }
        // -7b5 R2
        else if (interval1 === 4 && interval2 === 2 && interval3 === 3) {
            triadType = '-7b5';
            inversion = 'R2';
            fundamental = note3.slice(0, -1);
        }
        // Maj7 R3
        else if (interval1 === 1 && interval2 === 4 && interval3 === 3) {
            triadType = 'Maj7';
            inversion = 'R3';
            fundamental = note2.slice(0, -1);
        }
        // Min7 R3
        else if (interval1 === 2 && interval2 === 3 && interval3 === 4) {
            triadType = 'Min7';
            inversion = 'R3';
            fundamental = note2.slice(0, -1);
        }
        // 7 R3
        else if (interval1 === 2 && interval2 === 4 && interval3 === 3) {
            triadType = '7';
            inversion = 'R3';
            fundamental = note2.slice(0, -1);

        }
        // -7b5 R3
        else if (interval1 === 2 && interval2 === 3 && interval3 === 3) {
            triadType = '-7b5';
            inversion = 'R3';
            fundamental = note2.slice(0, -1);
        }
        // Dim7 PF
        else if (interval1 === 3 && interval2 === 3 && interval3 === 3) {
            triadType = 'Dim7';
            inversion = 'PF';
        }
        // Dim7 D2 PF
        else if (interval1 === 6 && interval2 === 3 && interval3 === 6) {
            triadType = 'Dim7 D2';
            inversion = 'PF';
        }
        // Maj7 PF D2
        else if (interval1 === 7 && interval2 === 4 && interval3 === 5) {
            triadType = 'Maj7 D2';
            inversion = 'PF';
        }
        // Maj7 D2 R1
        else if (interval1 === 7 && interval2 === 1 && interval3 === 7) {
            triadType = 'Maj7 D2';
            inversion = 'R1';
            fundamental = note3.slice(0, -1);
        }
        // Maj7 D2 R2
        else if (interval1 === 5 && interval2 === 4 && interval3 === 7) {
            triadType = 'Maj7 D2';
            inversion = 'R2';
            fundamental = note3.slice(0, -1);
        }
        // Maj7 D2 R3
        else if (interval1 === 5 && interval2 === 3 && interval3 === 5) {
            triadType = 'Maj7 D2';
            inversion = 'R3';
            fundamental = note4.slice(0, -1);
        }
        // Min7 D2 PF
        else if (interval1 === 7 && interval2 === 3 && interval3 === 5) {
            triadType = 'Min7 D2';
            inversion = 'PF';
        }
        // Min7 D2 R1
        else if (interval1 === 7 && interval2 === 2 && interval3 === 7) {
            triadType = 'Min7 D2';
            inversion = 'R1';
            fundamental = note3.slice(0, -1); // Mise à jour pour l’accord D2
        }
        // Min7 D2 R2
        else if (interval1 === 5 && interval2 === 3 && interval3 === 7) {
            triadType = 'Min7 D2';
            inversion = 'R2';
            fundamental = note2.slice(0, -1);
        }
        // Min7 D2 R3
        else if (interval1 === 5 && interval2 === 4 && interval3 === 5) {
            triadType = 'Min7 D2';
            inversion = 'R3';
            fundamental = note4.slice(0, -1);
        }
        // 7sus4 PF
        else if (interval1 === 5 && interval2 === 2 && interval3 === 3) {
            triadType = '7sus4';
            inversion = 'PF';
        }
        // 7sus4 R1
        else if (interval1 === 2 && interval2 === 3 && interval3 === 2) {
            triadType = '7sus4';
            inversion = 'R1';
            fundamental = note4.slice(0, -1);
        }
        // 7sus4 R2
        else if (interval1 === 3 && interval2 === 2 && interval3 === 5) {
            triadType = '7sus4';
            inversion = 'R2';
            fundamental = note3.slice(0, -1);
        }
        // 7sus4 R3
        else if (interval1 === 2 && interval2 === 5 && interval3 === 2) {
            triadType = '7sus4';
            inversion = 'R3';
            fundamental = note2.slice(0, -1);
        }
        // 7sus4 D2 PF
        else if (interval1 === 7 && interval2 === 3 && interval3 === 7) {
            triadType = '7sus4 D2';
            inversion = 'PF';
        }
        // 7sus4 D2 R1
        else if (interval1 === 5 && interval2 === 2 && interval3 === 7) {
            triadType = '7sus4 D2';
            inversion = 'R1';
            fundamental = note3.slice(0, -1);
        }
        // 7sus4 D2 R2
        else if (interval1 === 5 && interval2 === 5 && interval3 === 5) {
            triadType = '7sus4 D2';
            inversion = 'R2';
            fundamental = note2.slice(0, -1);
        }
        // 7sus4 D2 R3
        else if (interval1 === 7 && interval2 === 2 && interval3 === 5) {
            triadType = '7sus4 D2';
            inversion = 'R3';
            fundamental = note4.slice(0, -1);

        }
        // 7 D2 PF
        else if (interval1 === 7 && interval2 === 3 && interval3 === 6) {
            triadType = '7 D2';
            inversion = 'PF';
        }
         // 7 D2 R1
            else if (interval1 === 6 && interval2 === 2 && interval3 === 7) {
                triadType = '7 D2';
                inversion = 'R1';
                fundamental = note3.slice(0, -1);
            }
        // 7 D2 R2
        else if (interval1 === 5 && interval2 === 4 && interval3 === 6) {
            triadType = '7 D2';
            inversion = 'R2';
            fundamental = note2.slice(0, -1);
        }
        // 7 D2 R3
        else if (interval1 === 6 && interval2 === 3 && interval3 === 5) {
            triadType = '7 D2';
            inversion = 'R3';
            fundamental = note4.slice(0, -1);

        }
        // -7b5 D2 PF
        else if (interval1 === 6 && interval2 === 4 && interval3 === 5) {
            triadType = '-7b5 D2';
            inversion = 'PF';
        }
         // -7b5 D2 R1
            else if (interval1 === 7 && interval2 === 2 && interval3 === 6) {
                triadType = '-7b5 D2';
                inversion = 'R1';
                fundamental = note3.slice(0, -1);
            }
        // -7b5 D2 R2
        else if (interval1 === 6 && interval2 === 3 && interval3 === 7) {
            triadType = '-7b5 D2';
            inversion = 'R2';
            fundamental = note2.slice(0, -1);
        }
        // -7b5 D2 R3
        else if (interval1 === 5 && interval2 === 3 && interval3 === 6) {
            triadType = '-7b5 D2';
            inversion = 'R3';
            fundamental = note4.slice(0, -1);

        }
        // TBN1 D2 F
        else if (interval1 === 6 && interval2 === 3 && interval3 === 5) {
            triadType = 'TBN 1 D2';
            inversion = 'R3';
            fundamental = note4.slice(0, -1);
         
        } else {
            console.error("Aucune correspondance trouvée pour l'accord analysé.");
        }
    
        return { triadType, inversion, fundamental };
    }
     

    function getRandomNoteInRange(octaveRange, startOctave = 2) {
        const randomOctave = Math.floor(Math.random() * octaveRange) + startOctave;
        const randomNote = Object.keys(noteMap)[Math.floor(Math.random() * Object.keys(noteMap).length)];
        return `${randomNote}${randomOctave}`;
    }

    function getEnharmonicEquivalent(note) {
        const noteName = note.slice(0, -1);
        const octave = note.slice(-1);
        const enharmonic = enharmonicMap[noteName];
        return enharmonic ? `${noteName}/${enharmonic}${octave}` : note;
    }

    function playSingleNoteThenTriad(notesArray, firstNote) {
        if (!preloadedSounds[firstNote]) {
            console.error(`Audio not preloaded for note: ${firstNote}`);
            document.getElementById('question').innerText = `Erreur: Le son de ${firstNote} n'a pas pu être chargé.`;
            return;
        }

        preloadedSounds[firstNote].play().then(() => {
            setTimeout(() => {
                stopAllSounds();
                notesArray.forEach(note => {
                    if (preloadedSounds[note]) {
                        preloadedSounds[note].currentTime = 0;
                        preloadedSounds[note].play().catch(error => console.error('Error playing audio:', error));
                    } else {
                        console.error(`Audio not preloaded for note: ${note}`);
                    }
                });
                setTimeout(stopAllSounds, 8000);
            }, 4000);
        }).catch(error => console.error('Error playing audio:', error));
    }

    function updateOptions() {
        const optionsDiv = document.getElementById('options');
        optionsDiv.innerHTML = '';

        const triadSelect = document.createElement('select');
        triadSelect.id = 'triad-select';
        triads.forEach(triad => {
            const option = document.createElement('option');
            option.value = triad.label;
            option.textContent = triad.label;
            triadSelect.appendChild(option);
        });

        const inversionSelect = document.createElement('select');
        inversionSelect.id = 'inversion-select';
        inversions.forEach(inversion => {
            const option = document.createElement('option');
            option.value = inversion;
            option.textContent = inversion;
            inversionSelect.appendChild(option);
        });

        const fundamentalSelect = document.createElement('select');
        fundamentalSelect.id = 'fundamental-select';
        Object.keys(noteMap).forEach(note => {
            const option = document.createElement('option');
            const enharmonic = enharmonicMap[note];
            option.value = note;
            option.textContent = enharmonic ? `${note}/${enharmonic}` : note;
            fundamentalSelect.appendChild(option);
        });

        const submitButton = document.createElement('button');
        submitButton.textContent = 'Submit';
        submitButton.style.backgroundColor = 'green';
        submitButton.style.color = 'white';
        submitButton.addEventListener('click', () => {
            const selectedTriad = triadSelect.value;
            const selectedInversion = inversionSelect.value;
            const selectedFundamental = fundamentalSelect.value;
            const selectedAnswer = `${selectedFundamental}${selectedTriad}${getInversionLabel(selectedInversion)}`;

            const validationMessage = document.getElementById('validation-message');
            if (selectedAnswer === correctAnswer) {
                validationMessage.textContent = 'Correcte !';
                validationMessage.style.color = 'green';
                correctAnswers++;
            } else {
                validationMessage.textContent = `Incorrect, la bonne réponse était ${correctAnswer}.`;
                validationMessage.style.color = 'red';
            }
            questionCount++;
            setTimeout(nextQuestion, 2000);
        });

        const replayButton = document.createElement('button');
        replayButton.textContent = 'Replay';
        replayButton.style.backgroundColor = 'yellow';
        replayButton.style.color = 'black';
        replayButton.addEventListener('click', replay);

        optionsDiv.appendChild(triadSelect);
        optionsDiv.appendChild(inversionSelect);
        optionsDiv.appendChild(fundamentalSelect);
        optionsDiv.appendChild(submitButton);
        optionsDiv.appendChild(replayButton);

        triadSelect.addEventListener('change', () => {
            inversionSelect.style.display = triadSelect.value.includes('Dim7') ? 'none' : 'block';
        });
        triadSelect.dispatchEvent(new Event('change'));
    }

    function getInversionLabel(inversion) {
        switch (inversion) {
            case 'Root Position':
                return 'PF';
            case 'First Inversion':
                return 'R1';
            case 'Second Inversion':
                return 'R2';
            case 'Third Inversion':
                return 'R3';
            default:
                return '';
        }
    }
});
