// Преработал SoundQueue в SoundEntity
// Оставил класс, так как в планах добавить ещё больше возможностей для работы со звуком
class SoundEntity
{
	constructor(clipSrc){
		this.clipSrc = clipSrc;
	}

	play(){
		if (globalSoundsCounter < soundLimiter){
			const ac = new Audio(this.clipSrc);
			ac.addEventListener('ended', () => {
				globalSoundsCounter--;
			});
            ac.play();
			globalSoundsCounter++;
		}
	}
}
