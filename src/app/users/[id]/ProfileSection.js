'use client';
import { User } from '@nextui-org/react';
import Rating from '@mui/material/Rating';
import { useState, useEffect } from 'react';
import { Popover, Text, Badge } from '@nextui-org/react';
import pb from '@/app/(lib)/pocketbase';
import { useRouter } from 'next/navigation';

export const ProfileSection = ({ user, avgUserRating }) => {
  const { name, avatar, id } = user;
  const [ratingValue, setRatingValue] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [descriptionContent, setDescriptionContent] =
    useState('No ratings yet');

  async function handleRating(newValue) {
    // if (newValue === null || newValue === 0) {
    //   deletePreviousRatingIfExists();
    // }
    setRatingValue(newValue);
    const rating = {
      userGivingRating: pb.authStore.model.id,
      rating: newValue,
      //Get id of user that is showed on the page
      userRated: id,
    };
    //Delete previous rating if exists
    await deletePreviousRatingIfExists();
    if (newValue != null) {
      try {
        await pb.collection('ratings').create(rating);
        setRatingFeedback('Rating submitted');
        setIsOpen(true);
        //wait 1 second before closing popover
        setTimeout(() => {
          setIsOpen(false);
        }, 1000);
      } catch (error) {
        console.log(error);
        setRatingFeedback('Error submitting rating');
        setIsOpen(true);
      }
    } else {
      setRatingFeedback('Rating deleted');
      setIsOpen(true);
    }
  }

  async function deletePreviousRatingIfExists() {
    try {
      const records = await pb.collection('ratings').getFullList(50, {
        filter: `userRated = "${id}" && userGivingRating = "${pb.authStore.model.id}"`,
      });
      if (records.length > 0) {
        records.forEach((record) => {
          pb.collection('ratings').delete(record.id);
        });
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function getPreviousRatingIfExists() {
    try {
      const records = await pb.collection('ratings').getFullList(50, {
        filter: `userRated = "${id}" && userGivingRating = "${pb.authStore.model.id}"`,
      });

      if (records.length > 0) {
        console.log('found previous rating');
        return records[0].rating;
      } else {
        console.log('no previous rating found');
        return 0;
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getPreviousRatingIfExists().then((value) => {
      setRatingValue(value);
    });
    if (avgUserRating != 0) {
      setDescriptionContent('Average Rating: ' + avgUserRating + ' / 5');
    }
  }, []);

  return (
    <>
      <div
        style={{
          display: 'flex',
          margin: '20px 0 20px 0',
          justifyContent: 'space-between',
        }}
      >
        <User
          name={name}
          src={
            avatar && `http://127.0.0.1:8090/api/files/users/${id}/${avatar}`
          }
          text={name && name.match(/\b\w/g).join('')}
          size="xl"
          description={descriptionContent}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {pb.authStore.isValid && pb.authStore.model.id != id && (
            <>
              <Text size="$sm" wight="light">
                Rate user:
              </Text>
              <Popover isOpen={isOpen} onOpenChange={setIsOpen} color="success">
                <Popover.Trigger>
                  <Rating
                    style={{ alignSelf: 'center' }}
                    name="simple-controlled"
                    value={ratingValue}
                    onChange={(event, newValue) => {
                      handleRating(newValue);
                    }}
                  />
                </Popover.Trigger>
                <Popover.Content>
                  <Text css={{ m: 10 }}>{ratingFeedback}</Text>
                </Popover.Content>
              </Popover>
            </>
          )}
        </div>
      </div>
    </>
  );
};
