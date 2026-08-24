const reasonsList = [
  "Por cómo la calidez de tus abrazos hacen que todo mi alrededor se calme mientras somos solo tu y yo.",
  "Porque a tu lado, hasta el silencio más prolongado se siente como la conversación más íntima y necesaria.",
  "Porque cada beso tuyo me sigue sabiendo al primero.",
  "Porque vives con una pasión que me contagia y me inspira profundamente a ser un mejor hombre.",
  "Por cómo logras convertir un día rutinario en uno extraordinario.",
  "Porque amo la manera en que tu risa estalla de forma genuina, haciéndome sentir el hombre más afortunado.",
  "Por la forma en como tomas mi mano en cada ocasión que estamos juntos.",
  "Por el aroma natural de tu piel, que se ha quedado tatuado en mi memoria.",
  "Por la paciencia infinita con la que desarmas mis inseguridades más irracionales, haciéndome sentir que soy suficiente.",
  "Porque amo la manera en que te adueñas de mi espacio.",
  "Porque tienes el don extraordinario de hacerme reír hasta que me duela el estómago.",
  "Por la manera en que pronuncias un 'te amo', el cual se siente tan sincero y perfecto.",
  "Por esa mirada cómplice que me lanzas en medio de una multitud cuando solo nosotros dos entendemos el chiste.",
  "Por cómo atesoras detalles diminutos —una canción, una nota o una foto nuestra— dándole valor eterno a nuestros recuerdos.",
  "Porque no temes mostrarte vulnerable, real y sin filtros conmigo, confiándome tus dudas más íntimas.",
  "Porque contigo el tiempo vuela cuando estamos juntos, pero se detiene en cada recuerdo que grabamos en nuestras memorias.",
  "Por la voz somnolienta, dulce y genuina con la que me das los buenos días.",
  "Porque incluso cuando caminas, me sigues pareciendo la mujer más fascinante.",
  "Por cómo celebras mis pequeños triunfos cotidianos con la misma euforia y orgullo que si fueran victorias gigantescas.",
  "Por esa espontaneidad tuya que me arranca de cualquier rutina.",
  "Por la inmensa paz que me inunda cuando apoyo mi frente contra la tuya y cerramos los ojos.",
  "Porque tienes la honestidad necesaria para decirme cuándo me equivoco, y el amor suficiente para ayudarme a ser mejor.",
  "Por la increíble sensación que me causa verte justo al despertar al lado mio mientras aun duermes profundamente.",
  "Por los miles de besos justo antes de un hasta luego después de un increíble día juntos.",
  "Porque podrían pasar mil años hablando contigo y te juro que seguiría siendo poco el tiempo a tu lado.",
  "Porque cada vez que tomas la iniciativa para cuidarme o consentirme, me recuerdas con hechos lo inmensamente valioso que soy.",
  "Porque me has enseñado, con una dulzura que no conocía, que merezco ser amado de manera profunda."
];

document.addEventListener('DOMContentLoaded', () => {
    const cardTrack = document.getElementById('cardTrack');
    const dotsContainer = document.getElementById('dotsContainer');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    let currentIndex = 0;
    const totalCards = reasonsList.length;

    // Initialize cards and dots
    reasonsList.forEach((reason, index) => {
        // Create Card
        const card = document.createElement('div');
        card.className = 'reason-card';
        
        const numberStr = String(index + 1).padStart(3, '0');
        card.innerHTML = `
            <p class="reason-number">RAZÓN ${numberStr}</p>
            <h3 class="reason-text">"${reason}"</h3>
        `;
        cardTrack.appendChild(card);

        // Create Dot
        const dot = document.createElement('div');
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });

    // Update Carousel Position
    function updateCarousel() {
        cardTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
        
        // Update dots
        document.querySelectorAll('.dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }

    function goToSlide(index) {
        currentIndex = index;
        updateCarousel();
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % totalCards;
        updateCarousel();
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + totalCards) % totalCards;
        updateCarousel();
    }

    // Event Listeners
    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);

    // Active Navigation Link on Scroll
    const sections = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
});
