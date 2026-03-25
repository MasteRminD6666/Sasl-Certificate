import React, { useState, useMemo } from "react";
import { getOnBoardingSlides } from "@/configs/constants";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Slider from "@/components/onboarding/slider";
import Slide from "@/components/onboarding/slide";
import { useLanguage } from "@/context/language.context";

export default function OnboardingScreen() {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const onBoardingSlides = useMemo(() => getOnBoardingSlides(t), [t]);
  const prev = onBoardingSlides[index - 1];
  const next = onBoardingSlides[index + 1];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Slider
        key={index}
        index={index}
        setIndex={setIndex}
        prev={
          prev && (
            <Slide
              index={index}
              setIndex={setIndex}
              slide={prev}
              totalSlides={onBoardingSlides.length}
            />
          )
        }
        next={
          next && (
            <Slide
              index={index}
              setIndex={setIndex}
              slide={next}
              totalSlides={onBoardingSlides.length}
            />
          )
        }
      >
        <Slide
          slide={onBoardingSlides[index]}
          index={index}
          setIndex={setIndex}
          totalSlides={onBoardingSlides.length}
        />
      </Slider>
    </GestureHandlerRootView>
  );
}
